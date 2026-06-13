import { MembershipStatus, RoleName, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";
import { hashPassword } from "@/lib/security/passwords";
import { createSecureToken } from "@/lib/security/tokens";
import type { CurrentSession } from "@/lib/auth/session";

type ActiveSession = NonNullable<CurrentSession>;

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function findOrganisationMembership(organisationId: string, userId: string) {
  return prisma.organisationMembership.findUnique({
    where: {
      organisationId_userId: {
        organisationId,
        userId
      }
    },
    include: { user: true, role: true }
  });
}

function ensureNotOrganisationOwner(session: ActiveSession, targetUserId: string) {
  if (session.organisation.ownerUserId === targetUserId) {
    throw new Error("Organisation owner cannot be changed by the user lifecycle API. Use a future ownership-transfer workflow.");
  }
}

export async function listOrganisationUsers(session: ActiveSession) {
  return prisma.organisationMembership.findMany({
    where: { organisationId: session.organisation.id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      },
      role: true,
      environmentAccess: true
    },
    orderBy: { createdAt: "asc" }
  });
}

export async function inviteUser(params: {
  request: Request;
  session: ActiveSession;
  email: string;
  displayName: string;
  username?: string | null;
  roleName: RoleName;
}) {
  const email = normaliseEmail(params.email);
  const temporaryUnusablePassword = createSecureToken(32);
  const passwordHash = await hashPassword(temporaryUnusablePassword);

  const role = await prisma.role.findUnique({ where: { name: params.roleName } });
  if (!role) throw new Error("Selected role does not exist.");
  if (params.roleName === "OWNER") {
    throw new Error("Owner invitations are blocked in Phase 1B. Use a future ownership transfer workflow.");
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      displayName: params.displayName.trim(),
      username: params.username?.trim() || undefined
    },
    create: {
      email,
      username: params.username?.trim() || undefined,
      displayName: params.displayName.trim(),
      passwordHash,
      status: UserStatus.INVITED
    }
  });

  const existingMembership = await findOrganisationMembership(params.session.organisation.id, user.id);
  if (existingMembership) {
    throw new Error("User already belongs to this organisation.");
  }

  const membership = await prisma.organisationMembership.create({
    data: {
      organisationId: params.session.organisation.id,
      userId: user.id,
      roleId: role.id,
      status: MembershipStatus.INVITED,
      invitedByUserId: params.session.user.id,
      environmentAccess: {
        create: ["LIVE", "TRAINING", "TEST"].map((environment) => ({
          environment: environment as "LIVE" | "TRAINING" | "TEST",
          allowed: true
        }))
      }
    },
    include: { user: true, role: true, environmentAccess: true }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "ADMINISTRATION",
    action: "USER_INVITED",
    targetType: "User",
    targetId: user.id,
    metadata: { invitedEmail: email, role: params.roleName }
  });

  return membership;
}

export async function activateUser(params: { request: Request; session: ActiveSession; targetUserId: string }) {
  const membership = await findOrganisationMembership(params.session.organisation.id, params.targetUserId);
  if (!membership) throw new Error("User does not belong to this organisation.");

  const updated = await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: params.targetUserId }, data: { status: UserStatus.ACTIVE } });
    return tx.organisationMembership.update({
      where: { id: membership.id },
      data: { status: MembershipStatus.ACTIVE, activatedAt: new Date(), suspendedAt: null },
      include: { user: true, role: true, environmentAccess: true }
    });
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "ADMINISTRATION",
    action: "USER_ACTIVATED",
    targetType: "User",
    targetId: params.targetUserId
  });

  return updated;
}

export async function suspendUser(params: { request: Request; session: ActiveSession; targetUserId: string }) {
  ensureNotOrganisationOwner(params.session, params.targetUserId);
  const membership = await findOrganisationMembership(params.session.organisation.id, params.targetUserId);
  if (!membership) throw new Error("User does not belong to this organisation.");

  const updated = await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: params.targetUserId }, data: { status: UserStatus.SUSPENDED } });
    await tx.session.updateMany({ where: { userId: params.targetUserId, logoutAt: null }, data: { logoutAt: new Date() } });
    return tx.organisationMembership.update({
      where: { id: membership.id },
      data: { status: MembershipStatus.SUSPENDED, suspendedAt: new Date() },
      include: { user: true, role: true, environmentAccess: true }
    });
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "ADMINISTRATION",
    action: "USER_SUSPENDED",
    targetType: "User",
    targetId: params.targetUserId
  });

  return updated;
}

export async function deactivateUser(params: { request: Request; session: ActiveSession; targetUserId: string }) {
  ensureNotOrganisationOwner(params.session, params.targetUserId);
  const membership = await findOrganisationMembership(params.session.organisation.id, params.targetUserId);
  if (!membership) throw new Error("User does not belong to this organisation.");

  const updated = await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: params.targetUserId }, data: { status: UserStatus.DEACTIVATED } });
    await tx.session.updateMany({ where: { userId: params.targetUserId, logoutAt: null }, data: { logoutAt: new Date() } });
    return tx.organisationMembership.update({
      where: { id: membership.id },
      data: { status: MembershipStatus.DEACTIVATED },
      include: { user: true, role: true, environmentAccess: true }
    });
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "ADMINISTRATION",
    action: "USER_DEACTIVATED",
    targetType: "User",
    targetId: params.targetUserId
  });

  return updated;
}

export async function assignUserRole(params: {
  request: Request;
  session: ActiveSession;
  targetUserId: string;
  roleName: RoleName;
}) {
  ensureNotOrganisationOwner(params.session, params.targetUserId);
  if (params.roleName === "OWNER") {
    throw new Error("Owner role assignment is blocked in Phase 1B. Use a future ownership transfer workflow.");
  }

  const membership = await findOrganisationMembership(params.session.organisation.id, params.targetUserId);
  if (!membership) throw new Error("User does not belong to this organisation.");

  const role = await prisma.role.findUnique({ where: { name: params.roleName } });
  if (!role) throw new Error("Selected role does not exist.");

  const updated = await prisma.organisationMembership.update({
    where: { id: membership.id },
    data: { roleId: role.id },
    include: { user: true, role: true, environmentAccess: true }
  });

  await auditLog({
    request: params.request,
    organisationId: params.session.organisation.id,
    userId: params.session.user.id,
    environment: params.session.environment,
    module: "ADMINISTRATION",
    action: "ROLE_CHANGED",
    targetType: "User",
    targetId: params.targetUserId,
    metadata: { previousRole: membership.role.name, newRole: params.roleName }
  });

  return updated;
}
