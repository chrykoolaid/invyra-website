import { DeviceStatus, DeviceType, OrganisationStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";
import { createSecureToken, hashToken } from "@/lib/security/tokens";
import type { CurrentSession } from "@/lib/auth/session";

type ActiveSession = NonNullable<CurrentSession>;

const deviceTypeValues: DeviceType[] = [
  "POS_REGISTER",
  "MANAGER_WORKSTATION",
  "INVENTORY_TERMINAL",
  "SCANNER",
  "BACK_OFFICE_DEVICE"
];

export function parseDeviceType(value: unknown): DeviceType {
  if (typeof value !== "string" || !deviceTypeValues.includes(value as DeviceType)) {
    throw new Error("Invalid device type.");
  }
  return value as DeviceType;
}

function deviceCodeExpiry(): Date {
  const hours = Number(process.env.INVYRA_DEVICE_CODE_HOURS ?? "24");
  return new Date(Date.now() + Math.max(1, hours) * 60 * 60 * 1000);
}

export async function listDevices(session: ActiveSession) {
  return prisma.device.findMany({
    where: { organisationId: session.organisation.id },
    include: { assignments: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function createDeviceActivationCode(params: {
  request: Request;
  session: ActiveSession;
  deviceType: DeviceType;
}) {
  const activeLicense = await prisma.license.findFirst({
    where: {
      organisationId: params.session.organisation.id,
      status: { in: ["ACTIVE", "EXPIRING"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      modules: { some: { module: "DEVICES", enabled: true } }
    }
  });

  if (!activeLicense) {
    throw new Error("Device activation requires an active Devices license entitlement.");
  }

  const code = createSecureToken(18);
  const activation = await prisma.deviceActivationCode.create({
    data: {
      organisationId: params.session.organisation.id,
      codeHash: hashToken(code),
      deviceType: params.deviceType,
      expiresAt: deviceCodeExpiry(),
      createdByUserId: params.session.user.id
    }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "DEVICES",
    action: "DEVICE_ACTIVATION_CODE_CREATED",
    targetType: "DeviceActivationCode",
    targetId: activation.id,
    metadata: { deviceType: params.deviceType, expiresAt: activation.expiresAt.toISOString() }
  });

  return {
    id: activation.id,
    code,
    deviceType: activation.deviceType,
    expiresAt: activation.expiresAt
  };
}

export async function activateDevice(params: {
  request: Request;
  code: string;
  deviceName: string;
  deviceIdentifier?: string | null;
  assignedLocation?: string | null;
}) {
  const activationCode = await prisma.deviceActivationCode.findUnique({
    where: { codeHash: hashToken(params.code) },
    include: { organisation: true }
  });

  if (!activationCode || activationCode.consumedAt) {
    throw new Error("Activation code is invalid or already consumed.");
  }

  if (activationCode.expiresAt <= new Date()) {
    throw new Error("Activation code has expired.");
  }

  if (activationCode.organisation.status !== OrganisationStatus.ACTIVE) {
    throw new Error("Organisation is not active.");
  }

  const activeLicense = await prisma.license.findFirst({
    where: {
      organisationId: activationCode.organisationId,
      status: { in: ["ACTIVE", "EXPIRING"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      modules: { some: { module: "DEVICES", enabled: true } }
    }
  });

  if (!activeLicense) {
    throw new Error("Device activation is blocked because the organisation has no active Devices entitlement.");
  }

  if (params.deviceIdentifier) {
    const existing = await prisma.device.findUnique({ where: { deviceIdentifier: params.deviceIdentifier } });
    if (existing) {
      throw new Error("Device identifier is already registered.");
    }
  }

  const device = await prisma.$transaction(async (tx) => {
    const createdDevice = await tx.device.create({
      data: {
        organisationId: activationCode.organisationId,
        deviceName: params.deviceName.trim(),
        deviceType: activationCode.deviceType,
        deviceIdentifier: params.deviceIdentifier?.trim() || null,
        assignedLocation: params.assignedLocation?.trim() || null,
        status: DeviceStatus.ACTIVATED,
        activatedAt: new Date(),
        assignments: params.assignedLocation?.trim()
          ? { create: { location: params.assignedLocation.trim() } }
          : undefined
      },
      include: { assignments: true }
    });

    await tx.deviceActivationCode.update({
      where: { id: activationCode.id },
      data: { consumedAt: new Date() }
    });

    await tx.deviceAuditLog.create({
      data: {
        deviceId: createdDevice.id,
        action: "DEVICE_ACTIVATED",
        metadata: { activationCodeId: activationCode.id }
      }
    });

    return createdDevice;
  });

  await auditLog({
    request: params.request,
    organisationId: activationCode.organisationId,
    environment: "LIVE",
    module: "DEVICES",
    action: "DEVICE_ACTIVATED",
    targetType: "Device",
    targetId: device.id,
    metadata: { deviceType: device.deviceType, deviceIdentifier: device.deviceIdentifier }
  });

  return device;
}

export async function suspendDevice(params: { request: Request; session: ActiveSession; deviceId: string }) {
  const device = await prisma.device.findFirst({
    where: { id: params.deviceId, organisationId: params.session.organisation.id }
  });
  if (!device) throw new Error("Device not found for this organisation.");
  if (device.status === DeviceStatus.RETIRED) throw new Error("Retired devices cannot be suspended.");

  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.device.update({
      where: { id: device.id },
      data: { status: DeviceStatus.SUSPENDED },
      include: { assignments: true }
    });
    await tx.deviceSession.updateMany({ where: { deviceId: device.id, endedAt: null }, data: { endedAt: new Date() } });
    await tx.deviceAuditLog.create({ data: { deviceId: device.id, action: "DEVICE_SUSPENDED" } });
    return record;
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "DEVICES",
    action: "DEVICE_SUSPENDED",
    targetType: "Device",
    targetId: device.id
  });

  return updated;
}

export async function retireDevice(params: { request: Request; session: ActiveSession; deviceId: string }) {
  const device = await prisma.device.findFirst({
    where: { id: params.deviceId, organisationId: params.session.organisation.id }
  });
  if (!device) throw new Error("Device not found for this organisation.");

  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.device.update({
      where: { id: device.id },
      data: { status: DeviceStatus.RETIRED, retiredAt: new Date() },
      include: { assignments: true }
    });
    await tx.deviceSession.updateMany({ where: { deviceId: device.id, endedAt: null }, data: { endedAt: new Date() } });
    await tx.deviceAuditLog.create({ data: { deviceId: device.id, action: "DEVICE_RETIRED" } });
    return record;
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "DEVICES",
    action: "DEVICE_RETIRED",
    targetType: "Device",
    targetId: device.id
  });

  return updated;
}
