import type { ModuleKey, PermissionLevel } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { CurrentSession } from "@/lib/auth/session";
import type { InventoryWorkflowEntry, PortalModuleEntry } from "@/lib/portal/module-catalog";

export type PortalAccessSnapshot = {
  environmentAllowed: boolean;
  enabledModules: Set<ModuleKey>;
  permissions: Set<string>;
};

export type PortalVisibilityState = "available" | "restricted" | "licence-required" | "future" | "roadmap";

function permissionKey(module: ModuleKey, level: PermissionLevel) {
  return `${module}.${level}`;
}

export async function getPortalAccessSnapshot(session: NonNullable<CurrentSession>): Promise<PortalAccessSnapshot> {
  const environmentAllowed = session.membership.environmentAccess.some(
    (entry) => entry.environment === session.environment && entry.allowed
  );

  const [activeLicense, rolePermissions, userOverrides] = await Promise.all([
    prisma.license.findFirst({
      where: {
        organisationId: session.organisation.id,
        status: { in: ["ACTIVE", "EXPIRING"] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      include: {
        modules: {
          select: {
            module: true,
            enabled: true
          }
        }
      }
    }),
    prisma.rolePermission.findMany({
      where: { roleId: session.membership.roleId },
      include: {
        permission: {
          select: {
            module: true,
            level: true
          }
        }
      }
    }),
    prisma.userPermissionOverride.findMany({
      where: {
        userId: session.user.id,
        organisationId: session.organisation.id
      },
      include: {
        permission: {
          select: {
            module: true,
            level: true
          }
        }
      }
    })
  ]);

  const permissions = new Set(
    rolePermissions.map((entry) => permissionKey(entry.permission.module, entry.permission.level))
  );

  for (const override of userOverrides) {
    const key = permissionKey(override.permission.module, override.permission.level);
    if (override.allowed) permissions.add(key);
    else permissions.delete(key);
  }

  return {
    environmentAllowed,
    enabledModules: new Set(
      activeLicense?.modules.filter((entry) => entry.enabled).map((entry) => entry.module) ?? []
    ),
    permissions
  };
}

export function hasPortalModuleAccess(
  snapshot: PortalAccessSnapshot,
  module: ModuleKey | undefined,
  level: PermissionLevel = "VIEW"
) {
  if (!module) return false;
  return snapshot.environmentAllowed && snapshot.enabledModules.has(module) && snapshot.permissions.has(permissionKey(module, level));
}

export function getPortalModuleVisibility(module: PortalModuleEntry, snapshot: PortalAccessSnapshot): PortalVisibilityState {
  if (!module.operational && module.status === "future") return "future";
  if (!module.operational) return "roadmap";
  if (!module.moduleKey || !snapshot.enabledModules.has(module.moduleKey)) return "licence-required";
  if (!hasPortalModuleAccess(snapshot, module.moduleKey, module.accessLevel ?? "VIEW")) return "restricted";
  return "available";
}

export function getInventoryWorkflowVisibility(
  workflow: InventoryWorkflowEntry,
  snapshot: PortalAccessSnapshot
): PortalVisibilityState {
  if (!snapshot.enabledModules.has("INVENTORY")) return "licence-required";
  if (!hasPortalModuleAccess(snapshot, "INVENTORY", workflow.accessLevel)) return "restricted";
  return "available";
}

export function getVisibilityLabel(state: PortalVisibilityState) {
  if (state === "available") return "Available";
  if (state === "restricted") return "Restricted";
  if (state === "licence-required") return "Licence Required";
  if (state === "future") return "Coming Later";
  return "Roadmap Module";
}

export function getVisibilityClass(state: PortalVisibilityState) {
  if (state === "available") return "state-enabled";
  if (state === "restricted") return "state-restricted";
  if (state === "licence-required") return "state-muted";
  if (state === "future") return "state-future";
  return "state-roadmap";
}
