import { EnvironmentName } from "@prisma/client";
import type { CurrentSession } from "@/lib/auth/session";
import { auditLog } from "@/lib/audit/audit";

export type ActivePlatformSession = NonNullable<CurrentSession>;

export function organisationScope(session: ActivePlatformSession) {
  return { organisationId: session.organisation.id };
}

export function environmentScope(session: ActivePlatformSession, environment?: EnvironmentName) {
  return {
    organisationId: session.organisation.id,
    environment: environment ?? session.environment
  };
}

export async function assertSameOrganisation(params: {
  request?: Request;
  session: ActivePlatformSession;
  targetOrganisationId: string;
  action: string;
  targetType?: string;
  targetId?: string;
}) {
  if (params.targetOrganisationId === params.session.organisation.id) return;

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "ADMINISTRATION",
    action: "ACCESS_DENIED",
    result: "DENIED",
    targetType: params.targetType,
    targetId: params.targetId,
    metadata: {
      reason: "CROSS_ORGANISATION_ACCESS_BLOCKED",
      attemptedOrganisationId: params.targetOrganisationId,
      action: params.action
    }
  });

  throw new Error("Cross-organisation access blocked.");
}

export function requireEnvironmentMatch(params: {
  session: ActivePlatformSession;
  requestedEnvironment?: EnvironmentName;
}) {
  const environment = params.requestedEnvironment ?? params.session.environment;
  const allowed = params.session.membership.environmentAccess.some((entry) => entry.environment === environment && entry.allowed);
  if (!allowed) {
    throw new Error(`Environment ${environment} is not available for this membership.`);
  }
  return environment;
}
