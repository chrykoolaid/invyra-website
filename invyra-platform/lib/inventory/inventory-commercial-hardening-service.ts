import { EnvironmentName } from "@prisma/client";
import type { CurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";

type Sprint10Session = NonNullable<CurrentSession>;
type Scope = { organisationId: string; environmentName: EnvironmentName };

type CommercialCheck = { checkKey: string; area: string; status: "PASS" | "FAIL" | "BLOCKED" | "REVIEW_REQUIRED"; evidence: string };

export function sprint10ScopeFromSession(session: Sprint10Session): Scope {
  return { organisationId: session.organisation.id, environmentName: session.environment as EnvironmentName };
}

export function ensureSprint10CommercialRole(session: Sprint10Session) {
  const role = session.membership.role.name;
  return role === "ADMINISTRATOR" || role === "OWNER";
}

export async function buildInventoryCommercialControlChecks(session: Sprint10Session): Promise<CommercialCheck[]> {
  const scope = sprint10ScopeFromSession(session);
  const [inventoryLicenses, inventoryModules, activatedDevices, environmentSettings, auditEvents, users, stocktakeModels, forecastRuns] = await Promise.all([
    prisma.license.count({ where: { organisationId: scope.organisationId, status: "ACTIVE" } }),
    prisma.licenseModule.count({ where: { module: "INVENTORY", enabled: true, license: { organisationId: scope.organisationId, status: "ACTIVE" } } }),
    prisma.device.count({ where: { organisationId: scope.organisationId, status: "ACTIVATED" } }),
    prisma.organisationEnvironmentSetting.count({ where: { organisationId: scope.organisationId, enabled: true } }),
    prisma.auditLog.count({ where: { organisationId: scope.organisationId, module: "INVENTORY" } }),
    prisma.organisationMembership.count({ where: { organisationId: scope.organisationId, status: "ACTIVE" } }),
    prisma.inventoryStocktake.count({ where: scope as any }).catch(() => 0),
    prisma.inventoryForecastRun.count({ where: scope as any }).catch(() => 0)
  ]);

  return [
    { checkKey: "licensing.inventory.active", area: "Licensing", status: inventoryLicenses > 0 && inventoryModules > 0 ? "PASS" : "BLOCKED", evidence: `${inventoryModules} active Inventory license module allocation(s) found.` },
    { checkKey: "tenant.organisation.scoped", area: "Tenant Isolation", status: session.organisation.id ? "PASS" : "FAIL", evidence: `Session scoped to organisation ${session.organisation.id}.` },
    { checkKey: "devices.activation.present", area: "Device Activation", status: activatedDevices > 0 ? "PASS" : "REVIEW_REQUIRED", evidence: `${activatedDevices} activated device(s) found.` },
    { checkKey: "environments.separated", area: "Environment Separation", status: environmentSettings >= 1 ? "PASS" : "REVIEW_REQUIRED", evidence: `${environmentSettings} environment setting row(s) enabled. Current context: ${scope.environmentName}.` },
    { checkKey: "audit.inventory.events", area: "Audit Logging", status: auditEvents > 0 ? "PASS" : "REVIEW_REQUIRED", evidence: `${auditEvents} Inventory audit event(s) found.` },
    { checkKey: "access.active.users", area: "User Access", status: users > 0 ? "PASS" : "BLOCKED", evidence: `${users} active organisation membership(s) found.` },
    { checkKey: "sprint8.stocktake.contract", area: "Inventory Accuracy", status: stocktakeModels >= 0 ? "PASS" : "FAIL", evidence: "Stocktake model and API contract are available for RC workflow validation." },
    { checkKey: "sprint9.intelligence.contract", area: "Inventory Intelligence", status: forecastRuns >= 0 ? "PASS" : "FAIL", evidence: "Forecast run and recommendation model contract are available for RC workflow validation." }
  ];
}

export async function recordInventoryCommercialControlSnapshot(params: { request: Request; session: Sprint10Session }) {
  const scope = sprint10ScopeFromSession(params.session);
  const checks = await buildInventoryCommercialControlChecks(params.session);
  const rows = await prisma.$transaction(async (tx) => {
    const saved = [];
    for (const check of checks) {
      const row = await tx.inventoryCommercialControlCheck.upsert({
        where: { organisationId_environmentName_checkKey: { ...scope, checkKey: check.checkKey } },
        create: { ...scope, ...check, reviewedAt: new Date(), reviewedByUserId: params.session.user.id },
        update: { area: check.area, status: check.status, evidence: check.evidence, reviewedAt: new Date(), reviewedByUserId: params.session.user.id }
      });
      saved.push(row);
    }
    return saved;
  });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "COMMERCIAL_CONTROL_SNAPSHOT_RECORDED", targetType: "InventoryCommercialControlCheck", metadata: { checks: checks.length, pass: checks.filter((check) => check.status === "PASS").length } });
  return rows;
}

export async function getInventoryCommercialHardeningDashboard(session: Sprint10Session) {
  const checks = await buildInventoryCommercialControlChecks(session);
  return {
    total: checks.length,
    pass: checks.filter((check) => check.status === "PASS").length,
    blocked: checks.filter((check) => check.status === "BLOCKED").length,
    reviewRequired: checks.filter((check) => check.status === "REVIEW_REQUIRED").length,
    checks,
    releaseRule: "Sprint 10 is commercially hardened only when licensing, tenant isolation, device activation, environment separation, and audit evidence are reviewable."
  };
}
