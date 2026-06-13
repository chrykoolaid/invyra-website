import Link from "next/link";
import { redirect } from "next/navigation";
import { DeviceStatus } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { canAccessModule } from "@/lib/security/access-control";
import { inventoryPortalWorkflows } from "@/lib/portal/module-catalog";
import {
  buildInventorySetupActions,
  getInventorySetupActionClass,
  getInventorySetupActionLabel,
  getInventorySetupSummary,
  getNextInventorySetupAction,
  inventoryImportTemplates
} from "@/lib/portal/inventory-setup-actions";
import {
  getPortalAccessSnapshot,
  hasPortalModuleAccess
} from "@/lib/portal/portal-access";
import { PortalShell } from "@/components/PortalShell";

function getEnvironmentCopy(environment: string) {
  if (environment === "TRAINING") return "Training setup · safe practice preparation · no live stock impact";
  if (environment === "TEST") return "Test setup · controlled validation preparation only";
  return "LIVE setup · preparation for real operational inventory context";
}

export default async function InventorySetupActionsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "INVENTORY", level: "VIEW" });
  if (!allowed) redirect("/access-denied");

  const accessSnapshot = await getPortalAccessSnapshot(session);

  const [users, activeDeviceCount, totalDeviceCount] = await Promise.all([
    prisma.organisationMembership.findMany({
      where: { organisationId: session.organisation.id },
      select: { status: true }
    }),
    prisma.device.count({
      where: { organisationId: session.organisation.id, status: DeviceStatus.ACTIVATED }
    }),
    prisma.device.count({
      where: { organisationId: session.organisation.id }
    })
  ]);

  const activeUsers = users.filter((membership) => membership.status === "ACTIVE").length;
  const workflowShellsReady = inventoryPortalWorkflows.filter((workflow) => Boolean(workflow.slug)).length >= 12;
  const importPreparationReady = inventoryImportTemplates.length >= 5;

  const setupActions = buildInventorySetupActions({
    organisationReady: Boolean(session.organisation.name && session.organisation.industry && session.organisation.timezone && session.organisation.currency),
    inventoryLicensed: accessSnapshot.enabledModules.has("INVENTORY"),
    inventoryViewAllowed: hasPortalModuleAccess(accessSnapshot, "INVENTORY", "VIEW"),
    environmentAllowed: accessSnapshot.environmentAllowed,
    teamReady: activeUsers > 0,
    devicesReady: activeDeviceCount > 0,
    workflowShellsReady,
    readinessFlowReady: true,
    importPreparationReady,
    backendConnected: false,
    environment: session.environment
  });
  const summary = getInventorySetupSummary(setupActions);
  const nextAction = getNextInventorySetupAction(setupActions);

  return (
    <PortalShell session={session}>
      <section className={`environment-banner environment-${session.environment.toLowerCase()}`}>
        <strong>{session.environment}</strong>
        <span>{getEnvironmentCopy(session.environment)}</span>
      </section>

      <section className="hero-card inventory-hero-card setup-hero-card">
        <div>
          <p className="eyebrow">Inventory Setup Actions</p>
          <h1>Setup actions before live Inventory data</h1>
          <p>
            A calm, customer-safe setup board for {session.organisation.name}. It shows what can be reviewed now and what remains deferred until backend Inventory wiring is explicitly scoped.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="secondary-link" href="/portal/inventory">Inventory Dashboard</Link>
          <Link className="secondary-link" href="/portal/inventory/readiness">Readiness Flow</Link>
          <Link className="primary-link" href="/portal/inventory/imports">Data Import Preparation</Link>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-4">
        <article className="metric-card metric-card-primary">
          <span>Setup Actions</span>
          <strong>{summary.complete} complete</strong>
          <p>{summary.actionableTotal} actions can be reviewed before backend work</p>
        </article>
        <article className="metric-card">
          <span>Needs Action</span>
          <strong>{summary.needsAction}</strong>
          <p>Resolve before customer rollout</p>
        </article>
        <article className="metric-card">
          <span>Prepared</span>
          <strong>{summary.prepared}</strong>
          <p>Ready for future backend phases</p>
        </article>
        <article className="metric-card">
          <span>Deferred</span>
          <strong>{summary.deferred}</strong>
          <p>No live stock mutation in Phase 1G</p>
        </article>
      </section>

      {nextAction ? (
        <section className="card setup-next-action-card">
          <div>
            <p className="eyebrow">Next Safe Action</p>
            <h2>{nextAction.title}</h2>
            <p>{nextAction.description}</p>
          </div>
          <Link className={nextAction.state === "deferred" ? "secondary-link" : "primary-link"} href={nextAction.href}>
            {nextAction.actionLabel}
          </Link>
        </section>
      ) : null}

      <section className="setup-action-board">
        <div className="workflow-layout-header">
          <div>
            <p className="eyebrow">Phase 1G Setup Board</p>
            <h2>Inventory setup action list</h2>
            <p>Each card explains why the action matters, which dependency it protects, and the safe boundary before backend connection.</p>
          </div>
          <span className={`status-pill ${summary.needsAction === 0 ? "state-enabled" : "state-early"}`}>
            {summary.needsAction === 0 ? "Setup Prepared" : "Setup Needed"}
          </span>
        </div>

        <div className="setup-action-list">
          {setupActions.map((action, index) => (
            <article className="setup-action-card" key={action.id}>
              <div className="step-number">{index + 1}</div>
              <div className="setup-action-main">
                <div className="module-card-header">
                  <div>
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>
                  <span className={`status-pill ${getInventorySetupActionClass(action.state)}`}>
                    {getInventorySetupActionLabel(action.state)}
                  </span>
                </div>
                <div className="setup-action-detail-grid">
                  <span><strong>Owner:</strong> {action.owner}</span>
                  <span><strong>Why it matters:</strong> {action.whyItMatters}</span>
                  <span><strong>Safe boundary:</strong> {action.safeBoundary}</span>
                </div>
                <div className="setup-dependency-row">
                  {action.dependencies.map((dependency) => <span key={dependency}>{dependency}</span>)}
                </div>
              </div>
              <div className="readiness-flow-action">
                <Link className={action.state === "deferred" ? "secondary-link" : "primary-link"} href={action.href}>{action.actionLabel}</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Data Import Preparation</h2>
              <p>Template planning exists now. Uploads, parsing, preview, and database writes are not active in this phase.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            {inventoryImportTemplates.map((template) => <span key={template.id}>{template.title}: preparation only</span>)}
          </div>
          <Link className="secondary-link readiness-mini-action" href="/portal/inventory/imports">Open Import Preparation</Link>
        </article>

        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Phase Boundary</h2>
              <p>Setup actions improve readiness, but they do not connect live Inventory backend data.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            <span>No live uploads</span>
            <span>No parser active</span>
            <span>No stock mutation</span>
            <span>No supplier records created</span>
            <span>No purchase orders generated</span>
          </div>
        </article>
      </section>
    </PortalShell>
  );
}
