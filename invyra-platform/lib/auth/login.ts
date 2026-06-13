import { MembershipStatus, OrganisationStatus, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";
import { verifyPassword } from "@/lib/security/passwords";
import { createUserSession } from "@/lib/auth/session";
import { getClientIp, getUserAgent } from "@/lib/security/tokens";

export async function loginWithPassword(request: Request, identifier: string, password: string) {
  const normalisedIdentifier = identifier.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalisedIdentifier },
        { username: normalisedIdentifier }
      ]
    }
  });

  if (!user) {
    await prisma.failedLoginAttempt.create({
      data: {
        emailOrUsername: normalisedIdentifier,
        reason: "USER_NOT_FOUND",
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request)
      }
    });
    await auditLog({ request, action: "LOGIN_FAILED", result: "DENIED", metadata: { reason: "USER_NOT_FOUND", identifier: normalisedIdentifier } });
    return { ok: false as const, reason: "Invalid login details." };
  }

  if (user.status !== UserStatus.ACTIVE) {
    await prisma.failedLoginAttempt.create({
      data: {
        userId: user.id,
        emailOrUsername: normalisedIdentifier,
        reason: `USER_${user.status}`,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request)
      }
    });
    await auditLog({ request, userId: user.id, action: "LOGIN_FAILED", result: "DENIED", metadata: { reason: user.status } });
    return { ok: false as const, reason: "This account is not active." };
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    await prisma.failedLoginAttempt.create({
      data: {
        userId: user.id,
        emailOrUsername: normalisedIdentifier,
        reason: "BAD_PASSWORD",
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request)
      }
    });
    await auditLog({ request, userId: user.id, action: "LOGIN_FAILED", result: "DENIED", metadata: { reason: "BAD_PASSWORD" } });
    return { ok: false as const, reason: "Invalid login details." };
  }

  const membership = await prisma.organisationMembership.findFirst({
    where: {
      userId: user.id,
      status: MembershipStatus.ACTIVE,
      organisation: { status: OrganisationStatus.ACTIVE }
    },
    include: {
      organisation: true,
      role: true,
      environmentAccess: true
    },
    orderBy: { createdAt: "asc" }
  });

  if (!membership) {
    await auditLog({ request, userId: user.id, action: "LOGIN_FAILED", result: "DENIED", metadata: { reason: "NO_ACTIVE_ORGANISATION_MEMBERSHIP" } });
    return { ok: false as const, reason: "No active organisation access was found." };
  }

  const liveAllowed = membership.environmentAccess.some((entry) => entry.environment === "LIVE" && entry.allowed);
  const environment = liveAllowed ? "LIVE" : membership.environmentAccess.find((entry) => entry.allowed)?.environment ?? "LIVE";

  const session = await createUserSession({
    request,
    userId: user.id,
    organisationId: membership.organisationId,
    environment
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  await auditLog({
    request,
    organisationId: membership.organisationId,
    userId: user.id,
    environment,
    action: "LOGIN_SUCCESS",
    result: "SUCCESS",
    metadata: { role: membership.role.name }
  });

  return {
    ok: true as const,
    token: session.token,
    expiresAt: session.expiresAt,
    user,
    organisation: membership.organisation,
    role: membership.role,
    environment
  };
}
