import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/security/access-control";
import {
  getInventoryAdminConfigurationStatusClass,
  getInventoryAdminConfigurationStatusLabel,
  getInventoryAdminConfigurationSummary,
  inventoryAdminConfigurationBoundaries,
  inventoryAdminConfigurationGroups
} from "@/lib/portal/inventory-admin-configuration";
import { PortalShell } from "@/components/PortalShell";

function getEnvironmentCopy(environment: string) {
  if (environment === "TRAINING") return "Training configuration shell · no training settings are persisted yet";
  if (environment === "TEST") return "Test configuration shell · validation settings remain preparation-only";
  return "LIVE configuration shell · controls are disabled until backend persistence is scoped";
}

export default async function InventoryAdminConfigurationPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "INVENTORY", level: "ADMINISTER" });
  if (!allowed) redirect("/access-denied");

  const summary = getInventoryAdminConfigurationSummary();

  return (
    <PortalShell session={session}>
      <section className={`environment-banner environment-${session.environment.toLowerCase()}`}>
        <strong>{session.environment}</strong>
        <span>{getEnvironmentCopy(session.environment)}</span>
      </section>

      <section className="hero-card inventory-hero-card admin-config-hero-card">
        <div>
          <p className="eyebrow">Inventory Admin Configuration Shell</p>
          <h1>Prepare Inventory settings without enabling mutations</h1>
          <p>
            This admin-only page groups future Inventory configuration areas for {session.organisation.name}. It shows planned settings, safety rules, and backend contracts, but it does not save settings or mutate live data.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="secondary-link" href="/portal/inventory">Inventory Dashboard</Link>
          <Link className="secondary-link" href="/portal/inventory/settings">Settings Route</Link>
          <Link className="secondary-link" href="/portal/inventory/setup">Setup Actions</Link>
          <Link className="primary-link" href="/portal/inventory/readiness">Readiness Flow</Link>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-4">
        <article className="metric-card metric-card-primary">
          <span>Configuration Groups</span>
          <strong>{summary.groups}</strong>
          <p>Admin areas prepared</p>
        </article>
        <article className="metric-card">
          <span>Planned Settings</span>
          <strong>{summary.settings}</strong>
          <p>Documented as disabled controls</p>
        </article>
        <article className="metric-card">
          <span>Required Access</span>
          <strong>ADMINISTER</strong>
          <p>Inventory administer permission required</p>
        </article>
        <article className="metric-card">
          <span>Persistence</span>
          <strong>Disabled</strong>
          <p>No backend writes in Phase 1H</p>
        </article>
      </section>

      <section className="admin-config-boundary-panel">
        <div>
          <p className="eyebrow">Phase 1H Boundary</p>
          <h2>Configuration is visible, but not editable</h2>
          <p>
            These settings are intentionally represented as disabled planning controls. Backend persistence, validation, audit commit, and environment-scoped configuration storage remain separate implementation work.
          </p>
        </div>
        <div className="readiness-list readiness-list-left">
          {inventoryAdminConfigurationBoundaries.map((boundary) => <span key={boundary}>{boundary}</span>)}
        </div>
      </section>

      <section className="admin-config-board">
        <div className="workflow-layout-header">
          <div>
            <p className="eyebrow">Admin Configuration Groups</p>
            <h2>Inventory configuration structure</h2>
            <p>Each group is prepared for future backend settings, but every control remains disabled and non-mutating.</p>
          </div>
          <span className="status-pill state-early">Controls Disabled</span>
        </div>

        <div className="admin-config-group-list">
          {inventoryAdminConfigurationGroups.map((group) => (
            <article className="card admin-config-group-card" key={group.id}>
              <div className="module-card-header">
                <div>
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </div>
                <span className={`status-pill ${getInventoryAdminConfigurationStatusClass(group.status)}`}>
                  {getInventoryAdminConfigurationStatusLabel(group.status)}
                </span>
              </div>

              <div className="admin-config-meta-grid">
                <span><strong>Owner:</strong> {group.owner}</span>
                <span><strong>Access:</strong> INVENTORY.ADMINISTER</span>
                <span><strong>Environment scope:</strong> {group.environmentScope}</span>
              </div>

              <div className="admin-config-setting-list" aria-label={`${group.title} planned settings`}>
                {group.settings.map((setting) => (
                  <div className="admin-config-setting-row" key={setting.id}>
                    <div>
                      <strong>{setting.label}</strong>
                      <span>{setting.currentState}</span>
                    </div>
                    <div className="admin-config-disabled-control">
                      <span>{setting.plannedControl}</span>
                      <small>{setting.phaseBoundary}</small>
                    </div>
                  </div>
                ))}
              </div>

              <div className="dashboard-grid dashboard-grid-2 admin-config-detail-columns">
                <div>
                  <h4>Safety Rules</h4>
                  <div className="readiness-list readiness-list-left readiness-stack">
                    {group.safetyRules.map((rule) => <span key={rule}>{rule}</span>)}
                  </div>
                </div>
                <div>
                  <h4>Backend Contract Needed</h4>
                  <div className="readiness-list readiness-list-left readiness-stack">
                    {group.backendContract.map((contract) => <span key={contract}>{contract}</span>)}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Admin Action Boundary</h2>
              <p>Phase 1H deliberately avoids hidden write paths.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            <span>No save settings action</span>
            <span>No configuration form submission</span>
            <span>No upload controls</span>
            <span>No Prisma configuration writes</span>
            <span>No live stock adjustment</span>
          </div>
        </article>

        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Next Backend Contract</h2>
              <p>When backend configuration starts, these are the first non-negotiables.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            <span>Environment-scoped configuration table</span>
            <span>Permission-gated update actions</span>
            <span>Validation before save</span>
            <span>Audit log on every setting change</span>
            <span>Rollback evidence for configuration updates</span>
          </div>
        </article>
      </section>
    </PortalShell>
  );
}
