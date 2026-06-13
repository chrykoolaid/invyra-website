import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/security/access-control";
import {
  getInventoryWorkflowBySlug,
  getInventoryWorkflowRoutes,
  getWorkflowStatusLabel,
  inventoryPortalWorkflows
} from "@/lib/portal/module-catalog";
import { getInventoryWorkflowLayout } from "@/lib/portal/inventory-workflow-layouts";
import { inventoryEmptyStatePrinciples } from "@/lib/portal/inventory-readiness";
import {
  getInventoryWorkflowVisibility,
  getPortalAccessSnapshot,
  getVisibilityClass,
  getVisibilityLabel,
  hasPortalModuleAccess
} from "@/lib/portal/portal-access";
import { PortalShell } from "@/components/PortalShell";
import { getInventoryWorkflowReadOnlyTable, type InventoryPortalTable } from "@/lib/portal/inventory-read-only-portal-binding";


function ReadOnlyWorkflowTable({ table }: { table: InventoryPortalTable }) {
  return (
    <section className="card inventory-readonly-card workflow-readonly-binding" style={{ marginTop: 16 }}>
      <div className="section-heading compact">
        <div>
          <h2>{table.title}</h2>
          <p>{table.description}</p>
        </div>
        <span className={`status-pill state-${table.demoUxStatus === "demo_rows_visible" ? "enabled" : table.demoUxStatus === "empty_demo_ready" ? "muted" : "foundation"}`}>
          {table.demoUxLabel}
        </span>
      </div>
      <div className="demo-ux-review-note">
        <strong>Read-only demo UX review:</strong> {table.demoUxNote}
      </div>
      {table.rows.length ? (
        <div className="inventory-readonly-table-wrap">
          <table className="inventory-readonly-table">
            <thead>
              <tr>{table.columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
            </thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={`${table.title}-${index}`}>
                  {table.columns.map((column) => <td key={column.key}>{row[column.key] ?? "—"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="workflow-empty-state-panel phase1f-empty-state-panel">
          <strong>{table.emptyTitle}</strong>
          <p>{table.emptyDescription}</p>
          <span>{table.nextSafeAction}</span>
        </div>
      )}
      <div className="readiness-note-grid" style={{ marginTop: 12 }}>
        <span>Read-only portal binding active</span>
        <span>No create/edit/delete actions exposed</span>
        <span>No uploads or CSV parsing enabled</span>
        <span>No stock mutation enabled</span>
      </div>
    </section>
  );
}

function getEnvironmentCopy(environment: string) {
  if (environment === "TRAINING") return "Training environment · safe staff practice · never affects live stock";
  if (environment === "TEST") return "Test environment · controlled validation only";
  return "Live environment · real operational inventory context";
}

function getWorkflowClass(status: (typeof inventoryPortalWorkflows)[number]["status"]) {
  if (status === "ready-shell") return "state-enabled";
  if (status === "training-safe") return "state-training";
  if (status === "admin") return "state-foundation";
  return "state-muted";
}

function getNearbyWorkflows(currentId: string) {
  return inventoryPortalWorkflows.filter((workflow) => workflow.id !== currentId).slice(0, 6);
}

export function generateStaticParams() {
  return getInventoryWorkflowRoutes().map((workflow) => ({ workflow: workflow.slug }));
}

export default async function InventoryWorkflowPage({ params }: { params: { workflow: string } }) {
  const workflow = getInventoryWorkflowBySlug(params.workflow);
  if (!workflow) notFound();

  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "INVENTORY", level: workflow.accessLevel });
  if (!allowed) redirect("/access-denied");

  const accessSnapshot = await getPortalAccessSnapshot(session);
  const layout = getInventoryWorkflowLayout(workflow.id);
  const nearbyWorkflows = getNearbyWorkflows(workflow.id);
  const canAdministerInventory = hasPortalModuleAccess(accessSnapshot, "INVENTORY", "ADMINISTER");
  const readOnlyTable = await getInventoryWorkflowReadOnlyTable(session, workflow.id);

  return (
    <PortalShell session={session}>
      <section className={`environment-banner environment-${session.environment.toLowerCase()}`}>
        <strong>{session.environment}</strong>
        <span>{getEnvironmentCopy(session.environment)}</span>
      </section>

      <section className="hero-card inventory-hero-card workflow-hero-card">
        <div>
          <p className="eyebrow">Inventory Workflow Detail Layout</p>
          <h1>{workflow.title}</h1>
          <p>{workflow.pageSummary}</p>
        </div>
        <div className="hero-actions">
          <Link className="secondary-link" href="/portal/inventory">Inventory Dashboard</Link>
          <Link className="secondary-link" href="/portal/inventory/setup">Setup Actions</Link>
          <Link className="secondary-link" href="/portal/inventory/imports">Import Preparation</Link>
          {canAdministerInventory ? (
            <Link className="secondary-link" href="/portal/inventory/configuration">Admin Configuration</Link>
          ) : (
            <span className="secondary-link disabled-action">Admin Configuration · Restricted</span>
          )}
          <span className={`status-pill ${getWorkflowClass(workflow.status)}`}>
            {getWorkflowStatusLabel(workflow.status)}
          </span>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-4">
        <article className="metric-card metric-card-primary">
          <span>Layout Type</span>
          <strong>{layout.layoutLabel}</strong>
          <p>{layout.workspaceTitle}</p>
        </article>
        <article className="metric-card">
          <span>Access Level</span>
          <strong>INVENTORY.{workflow.accessLevel}</strong>
          <p>Protected by Inventory entitlement and environment access</p>
        </article>
        <article className="metric-card">
          <span>Environment</span>
          <strong>{session.environment}</strong>
          <p>{session.environment === "LIVE" ? "Operational context" : "Separated from LIVE stock"}</p>
        </article>
        <article className="metric-card">
          <span>Read-only Binding</span>
          <strong>{readOnlyTable.status === "read_only_bound" ? "Rows Available" : readOnlyTable.status === "read_only_empty" ? "No Rows Yet" : "Readiness Only"}</strong>
          <p>Service-backed display only; no workflow mutation actions are enabled</p>
        </article>
      </section>

      <ReadOnlyWorkflowTable table={readOnlyTable} />

      <section className="workflow-layout-shell">
        <div className="workflow-layout-header">
          <div>
            <p className="eyebrow">Phase 1E Layout</p>
            <h2>{layout.workspaceTitle}</h2>
            <p>{layout.workspaceDescription}</p>
          </div>
          <span className="section-count">Workflow-specific shell</span>
        </div>

        <div className="workflow-layout-grid">
          <article className="card workflow-main-zone">
            <div className="section-heading compact">
              <div>
                <h2>{layout.primaryZoneTitle}</h2>
                <p>{layout.primaryZoneDescription}</p>
              </div>
            </div>
            <div className="workflow-column-preview" aria-label="Planned workflow columns">
              {layout.plannedColumns.map((column) => <span key={column}>{column}</span>)}
            </div>
            <div className="workflow-empty-state-panel phase1f-empty-state-panel">
              <strong>{layout.emptyStateTitle}</strong>
              <p>{layout.emptyStateCopy}</p>
              <div className="empty-state-action-row">
                <Link className="secondary-link" href="/portal/inventory/readiness">Check Inventory Readiness</Link>
                <Link className="secondary-link" href="/portal/inventory/setup">Review Setup Actions</Link>
                {canAdministerInventory ? (
                  <Link className="secondary-link" href="/portal/inventory/configuration">Review Admin Configuration</Link>
                ) : (
                  <span>Admin configuration restricted to Inventory administrators.</span>
                )}
                <span>Backend connection remains deferred until scoped.</span>
                <span>Backend connection and import uploads remain deferred until scoped.</span>
              </div>
            </div>
          </article>

          <aside className="card workflow-side-zone">
            <div className="section-heading compact">
              <div>
                <h2>{layout.secondaryZoneTitle}</h2>
                <p>{layout.secondaryZoneDescription}</p>
              </div>
            </div>
            <div className="workflow-action-stack">
              {layout.plannedActions.map((action) => (
                <span className="workflow-disabled-action" key={action}>{action} · Backend later</span>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="card phase1f-empty-state-governance" style={{ marginTop: 16 }}>
        <div className="section-heading compact">
          <div>
            <h2>Empty State Governance</h2>
            <p>This workflow uses a guided empty state instead of fake operational rows.</p>
          </div>
          <Link className="secondary-link" href="/portal/inventory/readiness">Readiness Flow</Link>
        </div>
        <div className="readiness-note-grid">
          {inventoryEmptyStatePrinciples.map((principle) => <span key={principle}>{principle}</span>)}
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-3 workflow-detail-grid">
        {layout.workflowPanels.map((panel) => (
          <article className="card readiness-card-panel workflow-specific-panel" key={panel.title}>
            <div className="section-heading compact">
              <div>
                <h2>{panel.title}</h2>
                <p>{panel.description}</p>
              </div>
            </div>
            <div className="readiness-list readiness-list-left readiness-stack">
              {panel.items.map((item) => <span key={item}>{item}</span>)}
            </div>
          </article>
        ))}

        <article className="card readiness-card-panel workflow-specific-panel">
          <div className="section-heading compact">
            <div>
              <h2>Route Readiness</h2>
              <p>What is already safe to expose in the customer portal shell.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            {workflow.readiness.map((item) => <span key={item}>{item}</span>)}
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Backend Contract Needed</h2>
              <p>These are required before this workflow becomes operational.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            {layout.backendContract.map((item) => <span key={item}>{item}</span>)}
          </div>
        </article>

        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Safety Rules</h2>
              <p>Workflow-specific guardrails before backend actions are enabled.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            {layout.safetyRules.map((item) => <span key={item}>{item}</span>)}
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Environment Rule</h2>
              <p>The page must keep LIVE, TRAINING, and TEST visibly separated.</p>
            </div>
          </div>
          <p className="workflow-note">{workflow.environmentRule}</p>
        </article>

        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Role Guidance</h2>
              <p>Permission-based visibility is prepared before workflow actions are enabled.</p>
            </div>
          </div>
          <p className="workflow-note">{workflow.roleGuidance}</p>
        </article>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="section-heading compact">
          <div>
            <h2>Other Inventory Routes</h2>
            <p>Each route stays protected and avoids fake operational data until backend wiring starts.</p>
          </div>
        </div>
        <div className="workflow-route-list">
          {nearbyWorkflows.map((item) => {
            const visibility = getInventoryWorkflowVisibility(item, accessSnapshot);
            if (visibility === "available") {
              return (
                <Link className="workflow-route-link" href={item.href} key={item.id}>
                  <strong>{item.shortTitle}</strong>
                  <span>{getWorkflowStatusLabel(item.status)}</span>
                </Link>
              );
            }

            return (
              <span className="workflow-route-link workflow-route-disabled" key={item.id}>
                <strong>{item.shortTitle}</strong>
                <span className={getVisibilityClass(visibility)}>{getVisibilityLabel(visibility)}</span>
              </span>
            );
          })}
        </div>
      </section>
    </PortalShell>
  );
}
