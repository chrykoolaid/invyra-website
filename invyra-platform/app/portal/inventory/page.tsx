import Link from "next/link";
import { redirect } from "next/navigation";
import { DeviceStatus } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { canAccessModule } from "@/lib/security/access-control";
import { inventoryPortalWorkflows, getWorkflowStatusLabel } from "@/lib/portal/module-catalog";
import {
  getInventoryWorkflowVisibility,
  getPortalAccessSnapshot,
  getVisibilityClass,
  getVisibilityLabel,
  hasPortalModuleAccess
} from "@/lib/portal/portal-access";
import {
  buildInventoryReadinessSteps,
  getInventoryReadinessClass,
  getInventoryReadinessLabel,
  getInventoryReadinessSummary,
  inventoryEmptyStatePrinciples
} from "@/lib/portal/inventory-readiness";
import {
  buildInventorySetupActions,
  getInventorySetupActionClass,
  getInventorySetupActionLabel,
  getInventorySetupSummary,
  inventoryImportTemplates
} from "@/lib/portal/inventory-setup-actions";
import {
  getInventoryAdminConfigurationSummary,
  inventoryAdminConfigurationGroups
} from "@/lib/portal/inventory-admin-configuration";
import { PortalShell } from "@/components/PortalShell";
import { listPurchaseOrders } from "@/lib/inventory/inventory-procurement-service";
import { listInventoryLocations, listInventoryTransfers, listInTransitInventory } from "@/lib/inventory/inventory-transfer-service";
import { getConsumptionDashboard } from "@/lib/inventory/inventory-consumption-service";
import { getStocktakeDashboard } from "@/lib/inventory/inventory-stocktake-service";
import { getInventoryIntelligenceDashboard } from "@/lib/inventory/inventory-intelligence-service";
import { getInventoryCommercialHardeningDashboard } from "@/lib/inventory/inventory-commercial-hardening-service";
import { ConsumptionClient } from "@/components/inventory/ConsumptionClient";
import {
  getInventoryDashboardReadOnlyTables,
  getInventoryPortalReadOnlySummary,
  type InventoryPortalTable
} from "@/lib/portal/inventory-read-only-portal-binding";


function ReadOnlyBindingTable({ table }: { table: InventoryPortalTable }) {
  return (
    <article className="card inventory-readonly-card">
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
    </article>
  );
}

function getEnvironmentCopy(environment: string) {
  if (environment === "TRAINING") return "Training mode is safe staff practice and must never affect live stock.";
  if (environment === "TEST") return "Test mode is for controlled validation before operational release.";
  return "LIVE is the real operational inventory context. Do not use test or training data here.";
}

export default async function InventoryPortalPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "INVENTORY", level: "VIEW" });
  if (!allowed) redirect("/access-denied");

  const accessSnapshot = await getPortalAccessSnapshot(session);

  const canAdministerInventory = hasPortalModuleAccess(accessSnapshot, "INVENTORY", "ADMINISTER");
  const canCreateConsumption = hasPortalModuleAccess(accessSnapshot, "INVENTORY", "CREATE");

  const [readOnlySummary, readOnlyTables, purchaseOrders, inventoryLocations, inventoryTransfers, inTransitInventory, consumptionDashboard, stocktakeDashboard, intelligenceDashboard, commercialHardeningDashboard] = await Promise.all([
    getInventoryPortalReadOnlySummary(session),
    getInventoryDashboardReadOnlyTables(session, { includeConfiguration: canAdministerInventory }),
    listPurchaseOrders(session),
    listInventoryLocations(session),
    listInventoryTransfers(session),
    listInTransitInventory(session),
    getConsumptionDashboard(session),
    getStocktakeDashboard(session),
    getInventoryIntelligenceDashboard(session),
    getInventoryCommercialHardeningDashboard(session)
  ]);

  const [recentInventoryEvents, activeDeviceCount, pendingDeviceCount, totalDeviceCount, users] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organisationId: session.organisation.id, module: "INVENTORY" },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.device.count({
      where: { organisationId: session.organisation.id, status: DeviceStatus.ACTIVATED }
    }),
    prisma.device.count({
      where: { organisationId: session.organisation.id, status: DeviceStatus.PENDING }
    }),
    prisma.device.count({
      where: { organisationId: session.organisation.id }
    }),
    prisma.organisationMembership.findMany({
      where: { organisationId: session.organisation.id },
      select: { status: true }
    })
  ]);

  const activeUsers = users.filter((membership) => membership.status === "ACTIVE").length;
  const pendingInvites = users.filter((membership) => membership.status === "INVITED").length;
  const inventoryReadinessSteps = buildInventoryReadinessSteps({
    organisationReady: Boolean(session.organisation.name && session.organisation.industry && session.organisation.timezone && session.organisation.currency),
    inventoryLicensed: accessSnapshot.enabledModules.has("INVENTORY"),
    inventoryViewAllowed: hasPortalModuleAccess(accessSnapshot, "INVENTORY", "VIEW"),
    environmentAllowed: accessSnapshot.environmentAllowed,
    environment: session.environment,
    activeUsers,
    pendingInvites,
    registeredDevices: totalDeviceCount,
    activatedDevices: activeDeviceCount,
    workflowShellsReady: inventoryPortalWorkflows.filter((workflow) => Boolean(workflow.slug)).length >= 12
  });
  const inventoryReadinessSummary = getInventoryReadinessSummary(inventoryReadinessSteps);
  const inventorySetupActions = buildInventorySetupActions({
    organisationReady: Boolean(session.organisation.name && session.organisation.industry && session.organisation.timezone && session.organisation.currency),
    inventoryLicensed: accessSnapshot.enabledModules.has("INVENTORY"),
    inventoryViewAllowed: hasPortalModuleAccess(accessSnapshot, "INVENTORY", "VIEW"),
    environmentAllowed: accessSnapshot.environmentAllowed,
    teamReady: activeUsers > 0,
    devicesReady: activeDeviceCount > 0,
    workflowShellsReady: inventoryPortalWorkflows.filter((workflow) => Boolean(workflow.slug)).length >= 12,
    readinessFlowReady: true,
    importPreparationReady: inventoryImportTemplates.length >= 5,
    backendConnected: false,
    environment: session.environment
  });
  const inventorySetupSummary = getInventorySetupSummary(inventorySetupActions);
  const adminConfigurationSummary = getInventoryAdminConfigurationSummary();

  return (
    <PortalShell session={session}>
      <section className={`environment-banner environment-${session.environment.toLowerCase()}`}>
        <strong>{session.environment}</strong>
        <span>{getEnvironmentCopy(session.environment)}</span>
      </section>

      <section className="hero-card inventory-hero-card">
        <div>
          <p className="eyebrow">Available First · Inventory First</p>
          <h1>Inventory Dashboard</h1>
          <p>
            Licensed Inventory customer access layer for {session.organisation.name}. This is the portal shell before live Inventory backend wiring.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="secondary-link" href="/portal">Back to Portal</Link>
          <Link className="secondary-link" href="/portal/inventory/readiness">Readiness Flow</Link>
          <Link className="secondary-link" href="/portal/inventory/setup">Setup Actions</Link>
          <Link className="secondary-link" href="/portal/inventory/imports">Import Preparation</Link>
          {canAdministerInventory ? (
            <Link className="secondary-link" href="/portal/inventory/configuration">Admin Configuration</Link>
          ) : (
            <span className="secondary-link disabled-action">Admin Configuration · Restricted</span>
          )}
          <Link className="primary-link" href="/portal/licensing">Inventory Licence</Link>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-4">
        <article className="metric-card metric-card-primary">
          <span>Product · Inventory First</span>
          <strong>Inventory</strong>
          <p>Primary commercial module</p>
        </article>
        <article className="metric-card">
          <span>Role Context</span>
          <strong>{session.membership.role.name}</strong>
          <p>Permission-based visibility prepared</p>
        </article>
        <article className="metric-card">
          <span>Environment</span>
          <strong>{session.environment}</strong>
          <p>{session.environment === "LIVE" ? "Operational stock context" : "Separated from live stock"}</p>
        </article>
        <article className="metric-card">
          <span>Backend Status</span>
          <strong>Sprint 10 Bound</strong>
          <p>Master data, ledger, procurement, receiving, transfers, loss, consumption, stocktakes, intelligence, and commercial controls are wired</p>
        </article>
      </section>

      <section className="card phase2k-demo-ux-banner" style={{ marginTop: 16 }}>
        <div className="section-heading compact">
          <div>
            <h2>Read-only Demo UX QA</h2>
            <p>{readOnlySummary.demoUxNote}</p>
          </div>
          <span className="status-pill state-enabled">Phase {readOnlySummary.phase}</span>
        </div>
        <div className="readiness-note-grid">
          <span>Seeded demo rows may be visible after npm run seed:inventory-readonly-demo</span>
          <span>Tables are display-only</span>
          <span>No edit or import controls are enabled</span>
          <span>Environment remains scoped to {readOnlySummary.environment}</span>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-4 dashboard-bottom inventory-readonly-summary">
        <article className="metric-card metric-card-primary">
          <span>Read-only Binding</span>
          <strong>Phase {readOnlySummary.phase}</strong>
          <p>Service-backed portal data display is active</p>
        </article>
        <article className="metric-card">
          <span>Items / Suppliers</span>
          <strong>{readOnlySummary.counts.items} / {readOnlySummary.counts.suppliers}</strong>
          <p>Scoped to {readOnlySummary.environment}</p>
        </article>
        <article className="metric-card">
          <span>Movements / Stock Balances</span>
          <strong>{readOnlySummary.counts.movements} / {readOnlySummary.counts.stockBalances}</strong>
          <p>Read-only count visibility</p>
        </article>
        <article className="metric-card">
          <span>Write Boundary</span>
          <strong>Consumption Safe</strong>
          <p>Internal usage reduces stock only through STORE_USE ledger movements</p>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom inventory-readonly-binding-grid">
        {readOnlyTables.map((table) => <ReadOnlyBindingTable table={table} key={table.title} />)}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="section-heading compact">
          <div>
            <h2>Purchase Orders · Sprint 3 Procurement</h2>
            <p>Purchase orders are now operational procurement records. They never create ledger movements or change stock in Sprint 3.</p>
          </div>
          <span className="status-pill state-enabled">Stock mutation disabled</span>
        </div>
        {purchaseOrders.length ? (
          <div className="inventory-readonly-table-wrap">
            <table className="inventory-readonly-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Lines</th>
                  <th>Expected Total</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.supplierName}</td>
                    <td>{order.status.replaceAll("_", " ")}</td>
                    <td>{order.lineCount}</td>
                    <td>{order.expectedTotal}</td>
                    <td>{order.createdAt.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="workflow-empty-state-panel phase1f-empty-state-panel">
            <strong>No purchase orders yet.</strong>
            <p>Create draft purchase orders through the Sprint 3 API or future workspace UI. Receiving remains disabled until Sprint 4.</p>
            <span>Safe boundary: PO_CREATED / PO_APPROVED / PO_SENT do not affect inventory quantity.</span>
          </div>
        )}
      </section>



      <section className="card" style={{ marginTop: 16 }}>
        <div className="section-heading compact">
          <div>
            <h2>Locations & Transfers · Sprint 5 Multi-Location</h2>
            <p>Location-scoped inventory is active. Transfers conserve stock by dispatching out of the source and receiving into the destination.</p>
          </div>
          <span className="status-pill state-enabled">TRANSFER_OUT / TRANSFER_IN</span>
        </div>
        <div className="dashboard-grid dashboard-grid-3 dashboard-bottom">
          <article className="metric-card">
            <span>Locations</span>
            <strong>{inventoryLocations.length}</strong>
            <p>Environment scoped to {session.environment}</p>
          </article>
          <article className="metric-card">
            <span>Transfers</span>
            <strong>{inventoryTransfers.length}</strong>
            <p>Draft, approved, in-transit, and received transfer records</p>
          </article>
          <article className="metric-card">
            <span>In Transit Lines</span>
            <strong>{inTransitInventory.length}</strong>
            <p>Dispatched stock awaiting receiving confirmation</p>
          </article>
        </div>
        {inventoryTransfers.length ? (
          <div className="inventory-readonly-table-wrap">
            <table className="inventory-readonly-table">
              <thead>
                <tr>
                  <th>Transfer</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Lines</th>
                  <th>In Transit</th>
                </tr>
              </thead>
              <tbody>
                {inventoryTransfers.slice(0, 8).map((transfer) => (
                  <tr key={transfer.id}>
                    <td>{transfer.transferNumber}</td>
                    <td>{transfer.sourceLocation}</td>
                    <td>{transfer.destinationLocation}</td>
                    <td>{transfer.status.replaceAll("_", " ")}</td>
                    <td>{transfer.lineCount}</td>
                    <td>{transfer.inTransitQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="workflow-empty-state-panel phase1f-empty-state-panel">
            <strong>No transfers yet.</strong>
            <p>Create a transfer request through the Sprint 5 API once multiple locations and source stock exist.</p>
            <span>Safe boundary: approval does not move stock; dispatch creates TRANSFER_OUT and receipt creates TRANSFER_IN.</span>
          </div>
        )}
      </section>



      <section className="card" style={{ marginTop: 16 }}>
        <div className="section-heading compact">
          <div>
            <h2>Consumption Snapshot · Sprint 7</h2>
            <p>Internal consumption is now separated from waste and sales for cost-center accountability.</p>
          </div>
          <span className="status-pill state-enabled">STORE_USE</span>
        </div>
        <div className="dashboard-grid dashboard-grid-4 dashboard-bottom">
          <article className="metric-card"><span>Events</span><strong>{consumptionDashboard.eventCount}</strong><p>Manual and template usage</p></article>
          <article className="metric-card"><span>Lines</span><strong>{consumptionDashboard.lineCount}</strong><p>Inventory items consumed</p></article>
          <article className="metric-card"><span>Cost Centers</span><strong>{consumptionDashboard.costCenterCount}</strong><p>Accountability structure</p></article>
          <article className="metric-card"><span>Templates</span><strong>{consumptionDashboard.templateCount}</strong><p>Reusable service/production formulas</p></article>
        </div>
      </section>

      <ConsumptionClient canCreate={canCreateConsumption} environment={session.environment} />


      <section className="card" style={{ marginTop: 16 }}>
        <div className="section-heading compact">
          <div>
            <h2>Stocktakes & Accuracy · Sprint 8</h2>
            <p>Full, cycle, and blind counts are controlled through explicit reconciliation. Only approved reconciliation posts STOCKTAKE_ADJUSTMENT movements.</p>
          </div>
          <span className="status-pill state-enabled">STOCKTAKE_ADJUSTMENT</span>
        </div>
        <div className="dashboard-grid dashboard-grid-4 dashboard-bottom">
          <article className="metric-card"><span>Stocktakes</span><strong>{stocktakeDashboard.stocktakes}</strong><p>Count sessions</p></article>
          <article className="metric-card"><span>Lines</span><strong>{stocktakeDashboard.lines}</strong><p>Counted item/location rows</p></article>
          <article className="metric-card"><span>Variance Review</span><strong>{stocktakeDashboard.pendingVariance}</strong><p>Pending variance lines</p></article>
          <article className="metric-card"><span>Reconciled</span><strong>{stocktakeDashboard.reconciled}</strong><p>Posted to ledger</p></article>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="section-heading compact">
          <div>
            <h2>Inventory Intelligence · Sprint 9</h2>
            <p>Forecasting, ROP/ROQ, supplier scoring, transfer optimization, and new-store stocking are advisory until approved into operational workflows.</p>
          </div>
          <span className="status-pill state-enabled">Advisory only</span>
        </div>
        <div className="dashboard-grid dashboard-grid-4 dashboard-bottom">
          <article className="metric-card"><span>Forecast Runs</span><strong>{intelligenceDashboard.runs}</strong><p>Generated demand reviews</p></article>
          <article className="metric-card"><span>Open Recommendations</span><strong>{intelligenceDashboard.openRecommendations}</strong><p>Human review required</p></article>
          <article className="metric-card"><span>Supplier Scorecards</span><strong>{intelligenceDashboard.supplierScorecards}</strong><p>Supplier scoring evidence</p></article>
          <article className="metric-card"><span>New Store / Transfer</span><strong>{intelligenceDashboard.newStoreRecommendations + intelligenceDashboard.transferRecommendations}</strong><p>Stocking and balancing advice</p></article>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="section-heading compact">
          <div>
            <h2>Commercial Hardening · Sprint 10</h2>
            <p>Release evidence is checked across licensing, tenant isolation, device activation, environment separation, audit logging, and implementation contracts.</p>
          </div>
          <span className="status-pill state-enabled">Evidence-backed</span>
        </div>
        <div className="dashboard-grid dashboard-grid-4 dashboard-bottom">
          <article className="metric-card"><span>Controls</span><strong>{commercialHardeningDashboard.total}</strong><p>Release checks</p></article>
          <article className="metric-card"><span>Pass</span><strong>{commercialHardeningDashboard.pass}</strong><p>Evidence available</p></article>
          <article className="metric-card"><span>Review</span><strong>{commercialHardeningDashboard.reviewRequired}</strong><p>Needs runtime evidence</p></article>
          <article className="metric-card"><span>Blocked</span><strong>{commercialHardeningDashboard.blocked}</strong><p>Must resolve before GA</p></article>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card readiness-card-panel">
          <div className="section-heading compact">
            <div>
              <h2>Inventory Onboarding Readiness</h2>
              <p>Setup checklist for licensed Inventory customers before backend data connection.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left">
            <span>Required: {inventoryReadinessSummary.completeRequired} / {inventoryReadinessSummary.requiredTotal}</span>
            <span>Needs setup: {inventoryReadinessSummary.needsAction}</span>
            <span>Optional: {inventoryReadinessSummary.optional}</span>
            <span>Deferred: {inventoryReadinessSummary.deferred}</span>
          </div>
          <div className="readiness-note-grid readiness-mini-grid">
            {inventoryReadinessSteps.slice(0, 4).map((step) => (
              <span className={getInventoryReadinessClass(step.state)} key={step.id}>
                {step.title}: {getInventoryReadinessLabel(step.state)}
              </span>
            ))}
          </div>
          <Link className="secondary-link readiness-mini-action" href="/portal/inventory/readiness">Open Readiness Flow</Link>
        </article>

        <article className="card readiness-card-panel">
          <div className="section-heading compact">
            <div>
              <h2>Empty State Principles</h2>
              <p>What every Inventory workflow must show before live backend data exists.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            {inventoryEmptyStatePrinciples.map((principle) => <span key={principle}>{principle}</span>)}
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card setup-summary-panel">
          <div className="section-heading compact">
            <div>
              <h2>Setup Actions</h2>
              <p>Phase 1G setup board for customer rollout preparation before backend data is connected.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left">
            <span>Complete: {inventorySetupSummary.complete}</span>
            <span>Needs action: {inventorySetupSummary.needsAction}</span>
            <span>Prepared: {inventorySetupSummary.prepared}</span>
            <span>Deferred: {inventorySetupSummary.deferred}</span>
          </div>
          <div className="readiness-note-grid readiness-mini-grid">
            {inventorySetupActions.slice(0, 4).map((action) => (
              <span className={getInventorySetupActionClass(action.state)} key={action.id}>
                {action.title}: {getInventorySetupActionLabel(action.state)}
              </span>
            ))}
          </div>
          <Link className="secondary-link readiness-mini-action" href="/portal/inventory/setup">Open Setup Actions</Link>
        </article>

        <article className="card setup-summary-panel">
          <div className="section-heading compact">
            <div>
              <h2>Data Import Preparation</h2>
              <p>Template and validation planning only. Uploads and database writes are disabled.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            {inventoryImportTemplates.slice(0, 5).map((template) => <span key={template.id}>{template.title}: {template.backendBoundary}</span>)}
          </div>
          <Link className="secondary-link readiness-mini-action" href="/portal/inventory/imports">Open Import Preparation</Link>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card admin-config-summary-panel">
          <div className="section-heading compact">
            <div>
              <h2>Admin Configuration Shell</h2>
              <p>Phase 1H prepares Inventory settings groups without save buttons, forms, uploads, or database writes.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left">
            <span>Groups: {adminConfigurationSummary.groups}</span>
            <span>Planned settings: {adminConfigurationSummary.settings}</span>
            <span>Disabled controls: {adminConfigurationSummary.disabledControls}</span>
            <span>Backend deferred: {adminConfigurationSummary.backendDeferred}</span>
          </div>
          <div className="readiness-note-grid readiness-mini-grid">
            {inventoryAdminConfigurationGroups.slice(0, 4).map((group) => (
              <span className="state-early" key={group.id}>{group.title}: controls disabled</span>
            ))}
          </div>
          {canAdministerInventory ? (
            <Link className="secondary-link readiness-mini-action" href="/portal/inventory/configuration">Open Admin Configuration</Link>
          ) : (
            <span className="secondary-link readiness-mini-action disabled-action">Admin Configuration · Restricted</span>
          )}
        </article>

        <article className="card admin-config-summary-panel">
          <div className="section-heading compact">
            <div>
              <h2>Admin Safety Boundary</h2>
              <p>The configuration shell is intentionally non-mutating until backend persistence is scoped.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            <span>Requires INVENTORY.ADMINISTER</span>
            <span>No save settings action</span>
            <span>No configuration form submission</span>
            <span>No Prisma configuration writes</span>
            <span>No live stock mutation</span>
          </div>
        </article>
      </section>

      <section className="section-heading">
        <div>
          <h2>Inventory Workflows</h2>
          <p>Protected workflow detail layouts are now prepared for each Inventory workflow. Backend data connection comes in later scoped phases.</p>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-4 compact-module-grid">
        {inventoryPortalWorkflows.map((workflow) => {
          const visibility = getInventoryWorkflowVisibility(workflow, accessSnapshot);
          const available = visibility === "available";
          return (
            <article className={`module-card inventory-workflow-card ${available ? "" : "restricted-module-card"}`} key={workflow.id}>
              <div className="module-card-header">
                <h3>{workflow.title}</h3>
                <span className={`status-pill ${available ? "state-muted" : getVisibilityClass(visibility)}`}>
                  {available ? getWorkflowStatusLabel(workflow.status) : getVisibilityLabel(visibility)}
                </span>
              </div>
              <p>{workflow.description}</p>
              <p className="module-meta">Required access: INVENTORY.{workflow.accessLevel}</p>
              {available ? (
                <Link className="module-action secondary-action" href={workflow.href}>
                  {workflow.id === "inventory-dashboard" ? "Current Page" : "Open Detail Layout"}
                </Link>
              ) : visibility === "licence-required" ? (
                <Link className="module-action secondary-action" href="/portal/licensing">Review Licence</Link>
              ) : (
                <span className="module-action disabled-action">{getVisibilityLabel(visibility)}</span>
              )}
            </article>
          );
        })}
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Environment Rules</h2>
              <p>These rules protect customers from confusing training, test, and live stock contexts.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left">
            <span>LIVE: real operational inventory</span>
            <span>TRAINING: safe practice only</span>
            <span>TEST: controlled validation only</span>
            <span>Environment badge must stay visible</span>
            <span>No training data affects live stock</span>
          </div>
        </article>

        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Connection Status</h2>
              <p>This portal avoids misleading operational claims until backend Inventory routes are explicitly scoped.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left">
            <span>Portal shell: active</span>
            <span>Workflow detail layouts: active</span>
            <span>Licence guard: active</span>
            <span>Role guard: active</span>
            <span>Live stock data: not connected here yet</span>
          </div>
        </article>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="section-heading compact">
          <div>
            <h2>Recent Inventory Activity</h2>
            <p>Read-only audit events for Inventory module access and future workflow activity.</p>
          </div>
        </div>
        {recentInventoryEvents.length ? (
          <div className="activity-list">
            {recentInventoryEvents.map((event) => (
              <div className="activity-row" key={event.id}>
                <strong>{event.action.replaceAll("_", " ")}</strong>
                <span>{event.result} · {event.environment}</span>
                <small>{event.createdAt.toISOString().slice(0, 10)}</small>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No Inventory activity yet. This is expected before backend Inventory workflows are connected.</p>
        )}
      </section>
    </PortalShell>
  );
}
