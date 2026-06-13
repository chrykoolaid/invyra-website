import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";
import type { CurrentSession } from "@/lib/auth/session";

const DAY_MS = 24 * 60 * 60 * 1000;

export function sessionState(session: { logoutAt: Date | null; expiresAt: Date }): "ACTIVE" | "EXPIRED" | "LOGGED_OUT" {
  if (session.logoutAt) return "LOGGED_OUT";
  if (session.expiresAt <= new Date()) return "EXPIRED";
  return "ACTIVE";
}

export async function getSecuritySummary(session: NonNullable<CurrentSession>) {
  const since = new Date(Date.now() - DAY_MS);
  const organisationUserIds = await getOrganisationUserIds(session);

  const [sessions, failedLoginsLast24h, accessDeniedLast24h, activeUsers, suspendedUsers] = await Promise.all([
    prisma.session.findMany({
      where: { organisationId: session.organisation.id },
      select: { logoutAt: true, expiresAt: true }
    }),
    prisma.failedLoginAttempt.count({ where: { userId: { in: organisationUserIds }, createdAt: { gte: since } } }),
    prisma.auditLog.count({
      where: {
        organisationId: session.organisation.id,
        action: "ACCESS_DENIED",
        createdAt: { gte: since }
      }
    }),
    prisma.organisationMembership.count({
      where: { organisationId: session.organisation.id, status: "ACTIVE", user: { status: "ACTIVE" } }
    }),
    prisma.organisationMembership.count({
      where: {
        organisationId: session.organisation.id,
        OR: [{ status: "SUSPENDED" }, { user: { status: "SUSPENDED" } }]
      }
    })
  ]);

  return {
    activeSessions: sessions.filter((record) => sessionState(record) === "ACTIVE").length,
    expiredSessions: sessions.filter((record) => sessionState(record) === "EXPIRED").length,
    loggedOutSessions: sessions.filter((record) => sessionState(record) === "LOGGED_OUT").length,
    failedLoginsLast24h,
    accessDeniedLast24h,
    activeUsers,
    suspendedUsers
  };
}

export async function listOrganisationSessions(session: NonNullable<CurrentSession>) {
  const sessions = await prisma.session.findMany({
    where: { organisationId: session.organisation.id },
    include: { user: true },
    orderBy: { lastActivityAt: "desc" },
    take: 100
  });

  return sessions.map((record) => ({
    id: record.id,
    userEmail: record.user.email,
    userDisplayName: record.user.displayName,
    environment: record.environment,
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
    loginAt: record.loginAt,
    lastActivityAt: record.lastActivityAt,
    expiresAt: record.expiresAt,
    logoutAt: record.logoutAt,
    state: sessionState(record),
    current: record.id === session.id
  }));
}

export async function revokeOrganisationSession(params: {
  actorSession: NonNullable<CurrentSession>;
  targetSessionId: string;
  request?: Request;
}) {
  const target = await prisma.session.findFirst({
    where: {
      id: params.targetSessionId,
      organisationId: params.actorSession.organisation.id
    },
    include: { user: true }
  });

  if (!target) {
    await auditLog({
      request: params.request,
      organisationId: params.actorSession.organisation.id,
      userId: params.actorSession.user.id,
      environment: params.actorSession.environment,
      module: "ADMINISTRATION",
      action: "SESSION_REVOKE_FAILED",
      result: "DENIED",
      targetType: "Session",
      targetId: params.targetSessionId,
      metadata: { reason: "SESSION_NOT_FOUND_OR_NOT_IN_ORGANISATION" }
    });
    return null;
  }

  const revoked = await prisma.session.update({
    where: { id: target.id },
    data: { logoutAt: new Date() }
  });

  await auditLog({
    request: params.request,
    organisationId: params.actorSession.organisation.id,
    userId: params.actorSession.user.id,
    environment: params.actorSession.environment,
    module: "ADMINISTRATION",
    action: "SESSION_REVOKED",
    result: "SUCCESS",
    targetType: "Session",
    targetId: target.id,
    metadata: {
      targetUserId: target.userId,
      targetUserEmail: target.user.email,
      wasCurrentSession: target.id === params.actorSession.id
    }
  });

  return revoked;
}

async function getOrganisationUserIds(session: NonNullable<CurrentSession>) {
  const memberships = await prisma.organisationMembership.findMany({
    where: { organisationId: session.organisation.id },
    select: { userId: true }
  });
  return memberships.map((membership) => membership.userId);
}

export async function listFailedLoginAttempts(session: NonNullable<CurrentSession>) {
  const organisationUserIds = await getOrganisationUserIds(session);
  if (!organisationUserIds.length) return [];

  return prisma.failedLoginAttempt.findMany({
    where: { userId: { in: organisationUserIds } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

export async function listAccessDeniedAuditLogs(session: NonNullable<CurrentSession>) {
  return prisma.auditLog.findMany({
    where: {
      organisationId: session.organisation.id,
      action: "ACCESS_DENIED"
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

export async function listSecurityAuditLogs(session: NonNullable<CurrentSession>) {
  return prisma.auditLog.findMany({
    where: {
      organisationId: session.organisation.id,
      action: {
        in: [
          "LOGIN_SUCCESS",
          "LOGIN_FAILED",
          "LOGOUT",
          "PASSWORD_RESET_REQUESTED",
          "PASSWORD_RESET_COMPLETED",
          "SESSION_REVOKED",
          "SESSION_REVOKE_FAILED",
          "SESSION_EXPIRED",
          "ACCESS_DENIED",
          "ENVIRONMENT_SWITCHED",
          "USER_SUSPENDED",
          "USER_DEACTIVATED",
          "ROLE_CHANGED",
          "PERMISSION_CHANGED"
        ]
      }
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });
}
