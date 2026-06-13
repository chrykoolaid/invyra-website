import Link from "next/link";
import { redirect } from "next/navigation";
import type { ModuleKey } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth/session";
import { listLicenses, getLicenseConsumption } from "@/lib/licensing/licensing-management";
import { canAccessModule } from "@/lib/security/access-control";
import { getPortalModulesByGroup } from "@/lib/portal/module-catalog";
import {
  getPortalAccessSnapshot,
  getPortalModuleVisibility,
  getVisibilityClass,
  getVisibilityLabel
} from "@/lib/portal/portal-access";
import { PortalShell } from "@/components/PortalShell";

function formatDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "Not set";
}

export default async function LicensingPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "LICENSING", level: "VIEW" });
  if (!allowed) redirect("/access-denied");

  const accessSnapshot = await getPortalAccessSnapshot(session);
  const licenses = await listLicenses(session);
  const consumption = await getLicenseConsumption(session);
  const activeLicense = licenses.find((license) => license.status === "ACTIVE") ?? licenses[0] ?? null;
  const enabledModules = new Map<ModuleKey, { enabled: boolean; allocatedSeats?: number | null }>(
    activeLicense?.modules.map((module) => [module.module, { enabled: module.enabled, allocatedSeats: module.allocatedSeats }]) ?? []
  );
  const allocatedSeats = activeLicense?.modules.reduce((total, module) => total + (module.allocatedSeats ?? 0), 0) ?? 0;
  const assignedSeats = activeLicense?.users.length ?? 0;
  const availableSeats = allocatedSeats > 0 ? Math.max(allocatedSeats - assignedSeats, 0) : null;
  const registeredDevices = activeLicense?.devices.length ?? 0;
  const inventoryEntitlement = enabledModules.get("INVENTORY");

  return (
    <PortalShell session={session}>
      <section className="hero-card inventory-hero-card">
        <div>
          <p className="eyebrow">Licensing Center</p>
          <h1>Inventory-first licenses, seats, devices, and modules</h1>
          <p>{session.organisation.name} · {activeLicense?.status ?? "No active license"}</p>
        </div>
        <div className="hero-actions">
          <Link className="secondary-link" href="/portal">Back to Portal</Link>
          <Link className="primary-link" href="/portal/inventory">Open Inventory</Link>
          <Link className="secondary-link" href="/portal/admin/users">Manage Users</Link>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-4">
        <article className="metric-card metric-card-primary">
          <span>Primary Product</span>
          <strong>Inventory</strong>
          <p>{inventoryEntitlement?.enabled ? "Inventory enabled" : "Inventory entitlement required"}</p>
        </article>
        <article className="metric-card">
          <span>Current Plan</span>
          <strong>{activeLicense ? "Professional" : "Not assigned"}</strong>
          <p>Status: {activeLicense?.status ?? "Pending setup"}</p>
        </article>
        <article className="metric-card">
          <span>Seats</span>
          <strong>{assignedSeats}{allocatedSeats ? ` / ${allocatedSeats}` : ""}</strong>
          <p>{availableSeats === null ? "Unlimited / not set" : `${availableSeats} available`}</p>
        </article>
        <article className="metric-card">
          <span>Expiry</span>
          <strong>{formatDate(activeLicense?.expiresAt)}</strong>
          <p>{registeredDevices} devices assigned</p>
        </article>
      </section>

      <section className="section-heading">
        <div>
          <h2>Available First</h2>
          <p>Only Inventory should appear as the active commercial product module.</p>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-3">
        {getPortalModulesByGroup("available-first").map((module) => {
          const visibility = getPortalModuleVisibility(module, accessSnapshot);
          const enabled = visibility === "available";
          return (
            <article className="module-card module-card-primary" key={module.id}>
              <div className="module-card-header">
                <h3>{module.title}</h3>
                <span className={`status-pill ${getVisibilityClass(visibility)}`}>{getVisibilityLabel(visibility)}</span>
              </div>
              <p>{module.description}</p>
              <p>{module.moduleKey && enabledModules.get(module.moduleKey)?.allocatedSeats ? `${enabledModules.get(module.moduleKey)?.allocatedSeats} seats allocated` : "Seat allocation not set"}</p>
              {enabled ? (
                <Link className="module-action" href={module.href}>{module.actionLabel}</Link>
              ) : (
                <span className="module-action disabled-action">{getVisibilityLabel(visibility)}</span>
              )}
            </article>
          );
        })}
      </section>

      <section className="section-heading">
        <div>
          <h2>Platform Foundations</h2>
          <p>Supporting services for licensed Inventory customers.</p>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-4 compact-module-grid">
        {getPortalModulesByGroup("platform-foundation").map((module) => {
          const visibility = getPortalModuleVisibility(module, accessSnapshot);
          return (
            <article className="module-card compact-module-card" key={module.id}>
              <div className="module-card-header">
                <h3>{module.title}</h3>
                <span className={`status-pill ${getVisibilityClass(visibility)}`}>{getVisibilityLabel(visibility)}</span>
              </div>
              <p>{module.description}</p>
              {visibility === "available" ? (
                <Link className="module-action" href={module.href}>{module.actionLabel}</Link>
              ) : (
                <span className="module-action disabled-action">{getVisibilityLabel(visibility)}</span>
              )}
            </article>
          );
        })}
      </section>

      <section className="section-heading">
        <div>
          <h2>Future Modules</h2>
          <p>CRM, POS, and roadmap modules must not display operational Open actions yet.</p>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-3">
        {getPortalModulesByGroup("future-module").map((module) => {
          const visibility = getPortalModuleVisibility(module, accessSnapshot);
          return (
            <article className="module-card future-module-card" key={module.id}>
              <div className="module-card-header">
                <h3>{module.title}</h3>
                <span className={`status-pill ${getVisibilityClass(visibility)}`}>{getVisibilityLabel(visibility)}</span>
              </div>
              <p>{module.description}</p>
              {module.id === "crm" || module.id === "pos" ? (
                <Link className="module-action secondary-action" href={module.href}>View Roadmap</Link>
              ) : (
                <span className="module-action disabled-action">Roadmap Module</span>
              )}
            </article>
          );
        })}
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Seat Utilisation</h2>
              <p>How many users are assigned to licensed access.</p>
            </div>
          </div>
          <table className="table">
            <tbody>
              <tr><th>Purchased / allocated seats</th><td>{allocatedSeats || "Unlimited / not set"}</td></tr>
              <tr><th>Assigned seats</th><td>{assignedSeats}</td></tr>
              <tr><th>Available seats</th><td>{availableSeats === null ? "Unlimited / not set" : availableSeats}</td></tr>
            </tbody>
          </table>
        </article>

        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Device Utilisation</h2>
              <p>Registered devices attached to licensing.</p>
            </div>
          </div>
          <table className="table">
            <tbody>
              <tr><th>Registered devices</th><td>{registeredDevices}</td></tr>
              <tr><th>Device slots</th><td>Future billing-ready field</td></tr>
              <tr><th>Supported types</th><td>Inventory terminal, scanner, tablet, workstation</td></tr>
            </tbody>
          </table>
        </article>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="section-heading compact">
          <div>
            <h2>License Activity</h2>
            <p>Recent licensing events for this organisation.</p>
          </div>
        </div>
        {activeLicense?.events.length ? (
          <div className="activity-list">
            {activeLicense.events.slice(0, 8).map((event) => (
              <div className="activity-row" key={event.id}>
                <strong>{event.action.replaceAll("_", " ")}</strong>
                <span>{formatDate(event.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No license activity yet.</p>
        )}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="section-heading compact">
          <div>
            <h2>Consumption Detail</h2>
            <p>Operational consumption records kept for administration and future billing readiness.</p>
          </div>
        </div>
        <table className="table">
          <thead><tr><th>License</th><th>Status</th><th>Module</th><th>Allocated seats</th><th>Used users</th><th>Allocated devices</th></tr></thead>
          <tbody>
            {consumption.flatMap((license) => license.modules.map((module) => (
              <tr key={`${license.licenseId}-${module.module}`}>
                <td>{license.licenseId.slice(0, 8)}</td>
                <td>{license.status}</td>
                <td>{module.module}</td>
                <td>{module.allocatedSeats ?? "Unlimited / not set"}</td>
                <td>{module.usedUsers}</td>
                <td>{module.allocatedDevices}</td>
              </tr>
            )))}
          </tbody>
        </table>
      </section>
    </PortalShell>
  );
}
