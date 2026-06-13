import { EnvironmentName, ModuleKey, PermissionLevel } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";
import type { CurrentSession } from "@/lib/auth/session";

export async function canAccessModule(params: {
  session: NonNullable<CurrentSession>;
  module: ModuleKey;
  level: PermissionLevel;
  environment?: EnvironmentName;
  request?: Request;
}) {
  const environment = params.environment ?? params.session.environment;
  const membership = params.session.membership;

  const envAllowed = membership.environmentAccess.some((entry) => entry.environment === environment && entry.allowed);
  if (!envAllowed) {
    await auditLog({
      request: params.request,
      organisationId: params.session.organisation.id,
      userId: params.session.user.id,
      environment,
      module: params.module,
      action: "ACCESS_DENIED",
      result: "DENIED",
      metadata: { reason: "ENVIRONMENT_NOT_ALLOWED", requiredLevel: params.level }
    });
    return false;
  }

  const permission = await prisma.permission.findUnique({
    where: { module_level: { module: params.module, level: params.level } }
  });

  if (!permission) return false;

  const [rolePermission, userOverride] = await Promise.all([
    prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: membership.roleId,
          permissionId: permission.id
        }
      }
    }),
    prisma.userPermissionOverride.findUnique({
      where: {
        userId_permissionId_organisationId: {
          userId: params.session.user.id,
          organisationId: params.session.organisation.id,
          permissionId: permission.id
        }
      }
    })
  ]);

  if (userOverride?.allowed === false) {
    await auditLog({
      request: params.request,
      organisationId: params.session.organisation.id,
      userId: params.session.user.id,
      environment,
      module: params.module,
      action: "ACCESS_DENIED",
      result: "DENIED",
      metadata: { reason: "USER_PERMISSION_OVERRIDE_DENIED", role: membership.role.name, requiredLevel: params.level }
    });
    return false;
  }

  if (!rolePermission && userOverride?.allowed !== true) {
    await auditLog({
      request: params.request,
      organisationId: params.session.organisation.id,
      userId: params.session.user.id,
      environment,
      module: params.module,
      action: "ACCESS_DENIED",
      result: "DENIED",
      metadata: { reason: "ROLE_PERMISSION_MISSING", role: membership.role.name, requiredLevel: params.level }
    });
    return false;
  }

  const activeLicense = await prisma.license.findFirst({
    where: {
      organisationId: params.session.organisation.id,
      status: { in: ["ACTIVE", "EXPIRING"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      modules: {
        some: {
          module: params.module,
          enabled: true
        }
      }
    }
  });

  if (!activeLicense) {
    await auditLog({
      request: params.request,
      organisationId: params.session.organisation.id,
      userId: params.session.user.id,
      environment,
      module: params.module,
      action: "ACCESS_DENIED",
      result: "DENIED",
      metadata: { reason: "LICENSE_ENTITLEMENT_MISSING", requiredLevel: params.level }
    });
    return false;
  }

  return true;
}
