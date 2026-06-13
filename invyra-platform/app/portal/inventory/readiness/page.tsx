import Link from "next/link";
import { redirect } from "next/navigation";
import { DeviceStatus, LicenseStatus, ModuleKey } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { listLicenses } from "@/lib/licensing/licensing-management";
import { canAccessModule } from "@/lib/security/access-control";
import { inventoryPortalWorkflows } from "@/lib/portal/module-catalog";
import {
  buildInventoryReadinessSteps,
  getInventoryReadinessClass,
  getInventoryReadinessLabel,
  getInventoryReadinessSummary,
  inventoryEmptyStatePrinciples
} from "@/lib/portal/inventory-readiness";
import {
  getPortalAccessSnapshot,
  hasPortalModuleAccess
} from "@/lib/portal/portal-access";
import { PortalShell } from "@/components/PortalShell";

function getEnvironmentCopy(environment: string) {
  if (environment === "TRAINING") return "Training readiness · safe staff practice · never affects live stock";
  if (environment === "TEST") return "Test readiness · controlled validation only";
  return "LIVE readiness · real operational inventory context";
}

function formatDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "Not set";
}

export default async function InventoryReadinessPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "INVENTORY", level: "VIEW" });
  if (!allowed) redirect("/access-denied");

  const accessSnapshot = await getPortalAccessSnapshot(session);

  const [licenses, users, devices] = await Promise.all([
    listLicenses(session),
    prisma.organisationMembership.findMany({
      where: { organisationId: session.organisation.id },
      include: { role: true, user: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.device.findMany({
      where: { organisationId: session.organisation.id },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const activeLicense = licenses.find((license) => license.status === LicenseStatus.ACTIVE) ?? licenses[0] ?? null;
  const enabledModules = new Set<ModuleKey>(licenses.flatMap((license) => license.modules.filter((entry) => entry.enabled).map((entry) => entry.module)));
  const inventoryLicensed = enabledModules.has("INVENTORY");
  const inventoryViewAllowed = hasPortalModuleAccess(accessSnapshot, "INVENTORY", "VIEW");
  const organisationReady = Boolean(session.organisation.name && session.organisation.industry && session.organisation.timezone && session.organisation.currency);
  const activeUsers = users.filter((membership) => membership.status === "ACTIVE").length;
  const pendingInvites = users.filter((membership) => membership.status === "INVITED").length;
  const activatedDevices = devices.filter((device) => device.status === DeviceStatus.ACTIVATED).length;
  const workflowShellsReady = inventoryPortalWorkflows.filter((workflow) => Boolean(workflow.slug)).length >= 12;

  const readinessSteps = buildInventoryReadinessSteps({
    organisationReady,
    inventoryLicensed,
    inventoryViewAllowed,
    environmentAllowed: accessSnapshot.environmentAllowed,
    environment: session.environment,
    activeUsers,
    pendingInvites,
    registeredDevices: devices.length,
    activatedDevices,
    workflowShellsReady,
    importPreparationReady: true
  });
  const summary = getInventoryReadinessSummary(readinessSteps);
  const nextSetupStep = readinessSteps.find((step) => step.state === "needs-action") ?? readinessSteps.find((step) => step.state === "optional") ?? readinessSteps.find((step) => step.state === "deferred");

  return (
    <PortalShell session={session}>
      <section className={`environment-banner environment-${session.environment.toLowerCase()}`}>
        <strong>{session.environment}</strong>
        <span>{getEnvironmentCopy(session.environment)}</span>
      </section>

      <section className="hero-card inventory-hero-card readiness-hero-card">
        <div>
          <p className="eyebrow">Inventory Onboarding Readiness</p>
          <h1>Inventory setup readiness</h1>
          <p>
            A customer-safe setup flow for {session.organisation.name}. This confirms access, environment separation, and portal shell readiness before live Inventory backend data is connected.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="secondary-link" href="/portal/inventory">Inventory Dashboard</Link>
          <Link className="secondary-link" href="/portal/inventory/setup">Setup Actions</Link>
          <Link className="secondary-link" href="/portal/inventory/imports">Import Preparation</Link>
          {nextSetupStep ? <Link className="primary-link" href={nextSetupStep.href}>{nextSetupStep.actionLabel}</Link> : null}
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-4">
        <article className="metric-card metric-card-primary">
          <span>Required Readiness</span>
          <strong>{summary.completeRequired} / {summary.requiredTotal}</strong>
          <p>{summary.readyForShellUse ? "Ready for portal shell use" : "Setup still needed"}</p>
        </article>
        <article className="metric-card">
          <span>Needs Setup</span>
          <strong>{summary.needsAction}</strong>
          <p>Items requiring action before customer rollout</p>
        </article>
        <article className="metric-card">
          <span>Optional</span>
          <strong>{summary.optional}</strong>
          <p>Helpful before operations, not blocking the shell</p>
        </article>
        <article className="metric-card">
          <span>Deferred</span>
          <strong>{summary.deferred}</strong>
          <p>Requires explicit backend implementation scope</p>
        </article>
      </section>

      <section className="readiness-flow-shell">
        <div className="workflow-layout-header">
          <div>
            <p className="eyebrow">Phase 1F Readiness Flow</p>
            <h2>Inventory onboarding checkpoints</h2>
            <p>Each checkpoint gives the customer a clear setup state and a safe next action. Deferred backend work is labelled honestly.</p>
          </div>
          <span className={`status-pill ${summary.readyForShellUse ? "state-enabled" : "state-early"}`}>
            {summary.readyForShellUse ? "Shell Ready" : "Setup Needed"}
          </span>
        </div>

        <div className="readiness-flow-list">
          {readinessSteps.map((step, index) => (
            <article className="readiness-flow-step" key={step.id}>
              <div className={`step-number ${step.state === "complete" ? "step-complete" : ""}`}>{index + 1}</div>
              <div className="readiness-flow-main">
                <div className="module-card-header">
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                  <span className={`status-pill ${getInventoryReadinessClass(step.state)}`}>{getInventoryReadinessLabel(step.state)}</span>
                </div>
                <div className="readiness-note-grid">
                  {step.notes.map((note) => <span key={note}>{note}</span>)}
                </div>
              </div>
              <div className="readiness-flow-action">
                <span>{step.owner}</span>
                <Link className={step.state === "deferred" ? "secondary-link" : "primary-link"} href={step.href}>{step.actionLabel}</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Current Access Context</h2>
              <p>What the portal can safely infer right now.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            <span>Organisation: {organisationReady ? "configured" : "needs profile review"}</span>
            <span>Inventory licence: {inventoryLicensed ? "enabled" : "not enabled"}</span>
            <span>Inventory view: {inventoryViewAllowed ? "allowed" : "restricted"}</span>
            <span>Environment access: {accessSnapshot.environmentAllowed ? "allowed" : "restricted"}</span>
            <span>Current environment: {session.environment}</span>
            <span>Data import preparation: available, uploads disabled</span>
            <span>Active licence: {activeLicense?.status ?? "not found"}</span>
            <span>Licence expiry: {formatDate(activeLicense?.expiresAt)}</span>
          </div>
        </article>

        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Empty State Rules</h2>
              <p>Rules that prevent the portal from looking more operational than it is. Backend connection remains deferred until scoped.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            {inventoryEmptyStatePrinciples.map((principle) => <span key={principle}>{principle}</span>)}
          </div>
        </article>
      </section>

      <section className="card readiness-card">
        <div>
          <h2>{summary.readyForShellUse ? "Inventory shell readiness accepted" : "Inventory shell setup not complete yet"}</h2>
          <p>
            {summary.readyForShellUse
              ? "The portal shell can be used as the customer-facing Inventory entry layer. Backend Inventory connection remains a separate future phase."
              : "Complete the required setup items before treating this as a ready customer Inventory portal shell."}
          </p>
        </div>
        <div className="readiness-list">
          <span>Inventory-first only</span>
          <span>CRM/POS future only</span>
          <span>No fake backend claims</span>
          <span>Environment-aware</span>
        </div>
      </section>
    </PortalShell>
  );
}
