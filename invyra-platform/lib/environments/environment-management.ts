import { EnvironmentName } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";
import type { CurrentSession } from "@/lib/auth/session";

type ActiveSession = NonNullable<CurrentSession>;

const environmentValues: EnvironmentName[] = ["LIVE", "TRAINING", "TEST"];

export function parseEnvironmentName(value: unknown): EnvironmentName {
  if (typeof value !== "string" || !environmentValues.includes(value as EnvironmentName)) {
    throw new Error("Invalid environment. Supported values are LIVE, TRAINING, and TEST.");
  }
  return value as EnvironmentName;
}

export async function listEnvironmentAccess(session: ActiveSession) {
  const [organisationSettings, membershipAccess] = await Promise.all([
    prisma.organisationEnvironmentSetting.findMany({
      where: { organisationId: session.organisation.id },
      orderBy: { environment: "asc" }
    }),
    prisma.environmentAccess.findMany({
      where: { membershipId: session.membership.id },
      orderBy: { environment: "asc" }
    })
  ]);

  return environmentValues.map((environment) => {
    const organisationSetting = organisationSettings.find((entry) => entry.environment === environment);
    const membershipSetting = membershipAccess.find((entry) => entry.environment === environment);

    return {
      environment,
      active: session.environment === environment,
      organisationEnabled: organisationSetting?.enabled ?? false,
      memberAllowed: membershipSetting?.allowed ?? false,
      visibleLabel: organisationSetting?.visibleLabel ?? environment
    };
  });
}

export async function switchEnvironment(params: {
  request: Request;
  session: ActiveSession;
  environment: EnvironmentName;
}) {
  const organisationSetting = await prisma.organisationEnvironmentSetting.findUnique({
    where: {
      organisationId_environment: {
        organisationId: params.session.organisation.id,
        environment: params.environment
      }
    }
  });

  if (!organisationSetting?.enabled) {
    throw new Error("Environment is not enabled for this organisation.");
  }

  const membershipAccess = await prisma.environmentAccess.findUnique({
    where: {
      membershipId_environment: {
        membershipId: params.session.membership.id,
        environment: params.environment
      }
    }
  });

  if (!membershipAccess?.allowed) {
    await auditLog({
      request: params.request,
      organisationId: params.session.organisation.id,
      userId: params.session.user.id,
      environment: params.session.environment,
      action: "ACCESS_DENIED",
      result: "DENIED",
      targetType: "Environment",
      targetId: params.environment,
      metadata: { reason: "ENVIRONMENT_SWITCH_NOT_ALLOWED" }
    });
    throw new Error("You do not have access to this environment.");
  }

  const updatedSession = await prisma.session.update({
    where: { id: params.session.id },
    data: { environment: params.environment, lastActivityAt: new Date() }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.environment,
    action: "ENVIRONMENT_SWITCHED",
    targetType: "Session",
    targetId: params.session.id,
    metadata: { from: params.session.environment, to: params.environment }
  });

  return updatedSession;
}
