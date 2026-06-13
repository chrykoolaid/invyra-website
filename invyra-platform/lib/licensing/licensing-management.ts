import { DeviceType, LicenseStatus, ModuleKey } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";
import type { CurrentSession } from "@/lib/auth/session";

type ActiveSession = NonNullable<CurrentSession>;

const moduleValues: ModuleKey[] = ["CRM", "INVENTORY", "POS", "LICENSING", "DEVICES", "ADMINISTRATION"];
const statusValues: LicenseStatus[] = ["ACTIVE", "EXPIRING", "EXPIRED", "SUSPENDED", "CANCELLED"];
const deviceTypeValues: DeviceType[] = ["POS_REGISTER", "MANAGER_WORKSTATION", "INVENTORY_TERMINAL", "SCANNER", "BACK_OFFICE_DEVICE"];

export function parseModuleKey(value: unknown): ModuleKey {
  if (typeof value !== "string" || !moduleValues.includes(value as ModuleKey)) throw new Error("Invalid module key.");
  return value as ModuleKey;
}

export function parseLicenseStatus(value: unknown): LicenseStatus {
  if (typeof value !== "string" || !statusValues.includes(value as LicenseStatus)) throw new Error("Invalid license status.");
  return value as LicenseStatus;
}

export function parseDeviceTypeForLicensing(value: unknown): DeviceType {
  if (typeof value !== "string" || !deviceTypeValues.includes(value as DeviceType)) throw new Error("Invalid device type.");
  return value as DeviceType;
}

function parseDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid date value.");
  return parsed;
}

async function requireOrganisationLicense(session: ActiveSession, licenseId: string) {
  const license = await prisma.license.findFirst({
    where: { id: licenseId, organisationId: session.organisation.id },
    include: { modules: true, users: true, devices: true, events: true }
  });

  if (!license) throw new Error("License not found for this organisation.");
  return license;
}

export async function listLicenses(session: ActiveSession) {
  return prisma.license.findMany({
    where: { organisationId: session.organisation.id },
    include: { modules: true, users: true, devices: true, events: { orderBy: { createdAt: "desc" }, take: 10 } },
    orderBy: { createdAt: "desc" }
  });
}

export async function createLicense(params: {
  request: Request;
  session: ActiveSession;
  status?: LicenseStatus;
  startsAt?: string | null;
  expiresAt?: string | null;
  notes?: string | null;
  modules?: Array<{ module: ModuleKey; enabled?: boolean; allocatedSeats?: number | null }>;
}) {
  const license = await prisma.license.create({
    data: {
      organisationId: params.session.organisation.id,
      status: params.status ?? "ACTIVE",
      startsAt: parseDateOrNull(params.startsAt) ?? new Date(),
      expiresAt: parseDateOrNull(params.expiresAt),
      notes: params.notes?.trim() || null,
      modules: params.modules?.length
        ? {
            create: params.modules.map((entry) => ({
              module: entry.module,
              enabled: entry.enabled ?? true,
              allocatedSeats: entry.allocatedSeats ?? null
            }))
          }
        : undefined,
      events: {
        create: { action: "LICENSE_CREATED", metadata: { createdBy: params.session.user.id } }
      }
    },
    include: { modules: true, users: true, devices: true, events: true }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "LICENSING",
    action: "LICENSE_CREATED",
    targetType: "License",
    targetId: license.id,
    metadata: { status: license.status, modules: license.modules.map((entry) => entry.module) }
  });

  return license;
}

export async function allocateLicenseModule(params: {
  request: Request;
  session: ActiveSession;
  licenseId: string;
  module: ModuleKey;
  enabled?: boolean;
  allocatedSeats?: number | null;
}) {
  await requireOrganisationLicense(params.session, params.licenseId);

  const moduleRecord = await prisma.licenseModule.upsert({
    where: {
      licenseId_module: {
        licenseId: params.licenseId,
        module: params.module
      }
    },
    update: {
      enabled: params.enabled ?? true,
      allocatedSeats: params.allocatedSeats ?? null
    },
    create: {
      licenseId: params.licenseId,
      module: params.module,
      enabled: params.enabled ?? true,
      allocatedSeats: params.allocatedSeats ?? null
    }
  });

  await prisma.licenseEvent.create({
    data: {
      licenseId: params.licenseId,
      action: "LICENSE_MODULE_ALLOCATED",
      metadata: { module: params.module, enabled: moduleRecord.enabled, allocatedSeats: moduleRecord.allocatedSeats }
    }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "LICENSING",
    action: "LICENSE_MODULE_ALLOCATED",
    targetType: "LicenseModule",
    targetId: moduleRecord.id,
    metadata: { licenseId: params.licenseId, module: params.module }
  });

  return moduleRecord;
}

export async function allocateLicenseUser(params: {
  request: Request;
  session: ActiveSession;
  licenseId: string;
  userId: string;
  module?: ModuleKey | null;
}) {
  await requireOrganisationLicense(params.session, params.licenseId);

  const membership = await prisma.organisationMembership.findUnique({
    where: { organisationId_userId: { organisationId: params.session.organisation.id, userId: params.userId } }
  });
  if (!membership) throw new Error("User is not a member of this organisation.");

  const existing = await prisma.licenseUser.findFirst({
    where: { licenseId: params.licenseId, userId: params.userId, module: params.module ?? null }
  });

  if (existing) return existing;

  const record = await prisma.licenseUser.create({
    data: { licenseId: params.licenseId, userId: params.userId, module: params.module ?? null }
  });

  await prisma.licenseEvent.create({
    data: { licenseId: params.licenseId, action: "LICENSE_USER_ALLOCATED", metadata: { userId: params.userId, module: params.module ?? null } }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "LICENSING",
    action: "LICENSE_USER_ALLOCATED",
    targetType: "LicenseUser",
    targetId: record.id,
    metadata: { licenseId: params.licenseId, targetUserId: params.userId, module: params.module ?? null }
  });

  return record;
}

export async function allocateLicenseDevice(params: {
  request: Request;
  session: ActiveSession;
  licenseId: string;
  deviceId?: string | null;
  deviceType?: DeviceType | null;
  module?: ModuleKey | null;
}) {
  await requireOrganisationLicense(params.session, params.licenseId);

  if (!params.deviceId && !params.deviceType) {
    throw new Error("Provide either a device ID or a device type entitlement.");
  }

  if (params.deviceId) {
    const device = await prisma.device.findFirst({ where: { id: params.deviceId, organisationId: params.session.organisation.id } });
    if (!device) throw new Error("Device not found for this organisation.");
  }

  const record = await prisma.licenseDevice.create({
    data: {
      licenseId: params.licenseId,
      deviceId: params.deviceId ?? null,
      deviceType: params.deviceType ?? null,
      module: params.module ?? null
    }
  });

  await prisma.licenseEvent.create({
    data: {
      licenseId: params.licenseId,
      action: "LICENSE_DEVICE_ALLOCATED",
      metadata: { deviceId: params.deviceId ?? null, deviceType: params.deviceType ?? null, module: params.module ?? null }
    }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "LICENSING",
    action: "LICENSE_DEVICE_ALLOCATED",
    targetType: "LicenseDevice",
    targetId: record.id,
    metadata: { licenseId: params.licenseId, deviceId: params.deviceId ?? null, deviceType: params.deviceType ?? null, module: params.module ?? null }
  });

  return record;
}

export async function updateLicenseStatus(params: {
  request: Request;
  session: ActiveSession;
  licenseId: string;
  status: LicenseStatus;
  reason?: string | null;
}) {
  await requireOrganisationLicense(params.session, params.licenseId);

  const license = await prisma.license.update({
    where: { id: params.licenseId },
    data: {
      status: params.status,
      events: { create: { action: "LICENSE_STATUS_CHANGED", metadata: { status: params.status, reason: params.reason ?? null } } }
    },
    include: { modules: true, users: true, devices: true, events: true }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "LICENSING",
    action: "LICENSE_STATUS_CHANGED",
    targetType: "License",
    targetId: params.licenseId,
    metadata: { status: params.status, reason: params.reason ?? null }
  });

  return license;
}

export async function updateLicenseExpiry(params: {
  request: Request;
  session: ActiveSession;
  licenseId: string;
  expiresAt?: string | null;
}) {
  await requireOrganisationLicense(params.session, params.licenseId);
  const expiresAt = parseDateOrNull(params.expiresAt ?? null);

  const license = await prisma.license.update({
    where: { id: params.licenseId },
    data: {
      expiresAt,
      events: { create: { action: "LICENSE_EXPIRY_UPDATED", metadata: { expiresAt: expiresAt?.toISOString() ?? null } } }
    },
    include: { modules: true, users: true, devices: true, events: true }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "LICENSING",
    action: "LICENSE_EXPIRY_UPDATED",
    targetType: "License",
    targetId: params.licenseId,
    metadata: { expiresAt: expiresAt?.toISOString() ?? null }
  });

  return license;
}

export async function getLicenseConsumption(session: ActiveSession) {
  const licenses = await prisma.license.findMany({
    where: { organisationId: session.organisation.id },
    include: { modules: true, users: true, devices: true }
  });

  return licenses.map((license) => ({
    licenseId: license.id,
    status: license.status,
    expiresAt: license.expiresAt,
    modules: license.modules.map((module) => ({
      module: module.module,
      enabled: module.enabled,
      allocatedSeats: module.allocatedSeats,
      usedUsers: license.users.filter((user) => user.module === module.module || user.module === null).length,
      allocatedDevices: license.devices.filter((device) => device.module === module.module || device.module === null).length
    }))
  }));
}
