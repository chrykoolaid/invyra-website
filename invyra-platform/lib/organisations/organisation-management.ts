import { OrganisationStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";
import type { CurrentSession } from "@/lib/auth/session";

type ActiveSession = NonNullable<CurrentSession>;

const editableProfileKeys = [
  "name",
  "legalName",
  "tradingName",
  "industry",
  "country",
  "timezone",
  "currency"
] as const;

type OrganisationProfileUpdate = Partial<Record<(typeof editableProfileKeys)[number], string | null>>;

export async function getOrganisationProfile(session: ActiveSession) {
  return prisma.organisation.findUnique({
    where: { id: session.organisation.id },
    include: {
      owner: {
        select: { id: true, email: true, displayName: true, status: true }
      },
      settings: true,
      environmentSettings: true,
      memberships: {
        select: { id: true, status: true, role: true, user: { select: { id: true, email: true, displayName: true, status: true } } }
      }
    }
  });
}

function cleanOptional(value: string | null | undefined) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function updateOrganisationProfile(params: {
  request: Request;
  session: ActiveSession;
  data: OrganisationProfileUpdate;
}) {
  const payload: OrganisationProfileUpdate = {};

  for (const key of editableProfileKeys) {
    if (key in params.data) {
      payload[key] = key === "name" || key === "country" || key === "timezone" || key === "currency"
        ? String(params.data[key] ?? "").trim()
        : cleanOptional(params.data[key]);
    }
  }

  if ("name" in payload && !payload.name) throw new Error("Organisation name is required.");
  if ("country" in payload && !payload.country) throw new Error("Country is required.");
  if ("timezone" in payload && !payload.timezone) throw new Error("Timezone is required.");
  if ("currency" in payload && !payload.currency) throw new Error("Currency is required.");

  const updated = await prisma.organisation.update({
    where: { id: params.session.organisation.id },
    data: payload,
    include: {
      owner: { select: { id: true, email: true, displayName: true, status: true } },
      settings: true,
      environmentSettings: true
    }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "ADMINISTRATION",
    action: "ORGANISATION_UPDATED",
    targetType: "Organisation",
    targetId: params.session.organisation.id,
    metadata: { changedFields: Object.keys(payload) }
  });

  return updated;
}

export async function updateOrganisationStatus(params: {
  request: Request;
  session: ActiveSession;
  status: OrganisationStatus;
  reason?: string | null;
}) {
  if (params.session.membership.role.name !== "OWNER") {
    throw new Error("Only the organisation owner can change organisation status.");
  }

  if (params.status === OrganisationStatus.CLOSED) {
    throw new Error("Closing an organisation is reserved for a future offboarding workflow.");
  }

  const updated = await prisma.organisation.update({
    where: { id: params.session.organisation.id },
    data: { status: params.status }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "ADMINISTRATION",
    action: "ORGANISATION_STATUS_CHANGED",
    targetType: "Organisation",
    targetId: params.session.organisation.id,
    metadata: { status: params.status, reason: params.reason ?? null }
  });

  return updated;
}

export async function listOrganisationSettings(session: ActiveSession) {
  return prisma.organisationSetting.findMany({
    where: { organisationId: session.organisation.id },
    orderBy: { key: "asc" }
  });
}

export async function upsertOrganisationSettings(params: {
  request: Request;
  session: ActiveSession;
  settings: Array<{ key: string; value: string }>;
}) {
  const cleanSettings = params.settings.map((setting) => ({
    key: setting.key.trim(),
    value: setting.value.trim()
  }));

  if (cleanSettings.some((setting) => !setting.key)) {
    throw new Error("Setting keys cannot be blank.");
  }

  const updated = await prisma.$transaction(
    cleanSettings.map((setting) =>
      prisma.organisationSetting.upsert({
        where: {
          organisationId_key: {
            organisationId: params.session.organisation.id,
            key: setting.key
          }
        },
        update: { value: setting.value },
        create: {
          organisationId: params.session.organisation.id,
          key: setting.key,
          value: setting.value
        }
      })
    )
  );

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "ADMINISTRATION",
    action: "ORGANISATION_SETTINGS_UPDATED",
    targetType: "Organisation",
    targetId: params.session.organisation.id,
    metadata: { keys: cleanSettings.map((setting) => setting.key) }
  });

  return updated;
}
