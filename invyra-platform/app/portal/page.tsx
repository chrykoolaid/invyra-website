import Link from "next/link";
import { redirect } from "next/navigation";
import { DeviceStatus, LicenseStatus, ModuleKey } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { listLicenses } from "@/lib/licensing/licensing-management";
import { getPortalModulesByGroup, inventoryPortalWorkflows } from "@/lib/portal/module-catalog";
import {
  getPortalAccessSnapshot,
  getPortalModuleVisibility,
  getVisibilityClass,
  getVisibilityLabel,
  hasPortalModuleAccess,
  type PortalVisibilityState
} from "@/lib/portal/portal-access";
import {
  buildInventoryReadinessSteps,
  getInventoryReadinessClass,
  getInventoryReadinessLabel,
  getInventoryReadinessSummary
} from "@/lib/portal/inventory-readiness";
import { PortalShell } from "@/components/PortalShell";

function formatDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "Not set";
}

function getEnvironmentCopy(environment: string) {
  if (environment === "TRAINING") return "Training environment · safe staff practice · never affects live stock";
  if (environment === "TEST") return "Test environment · controlled validation only";
  return "Live environment · real operational inventory context";
}

function moduleAction(module: { href: string; actionLabel: string }, visibility: PortalVisibilityState) {
  if (visibility === "available") {
    return <Link className="module-action" href={module.href}>{module.actionLabel}</Link>;
  }
  if (visibility === "licence-required") {
    return <Link className="module-action secondary-action" href="/portal/licensing">Review Licence</Link>;
  }
  if (visibility === "future" || visibility === "roadmap") {
    return <Link className="module-action secondary-action" href={module.href}>View Roadmap</Link>;
  }
  return <span className="module-action disabled-action">{getVisibilityLabel(visibility)}</span>;
}

export default async function PortalHomePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const accessSnapshot = await getPortalAccessSnapshot(session);

  const [licenses, users, devices, notifications, recentActivity] = await Promise.all([
    listLicenses(session),
    prisma.organisationMembership.findMany({
      where: { organisationId: session.organisation.id },
      include: { role: true, user: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.device.findMany({
      where: { organisationId: session.organisation.id },
      orderBy: { createdAt: "desc" }
    }),
    prisma.notification.findMany({
      where: { organisationId: session.organisation.id },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.auditLog.findMany({
      where: { organisationId: session.organisation.id },
      orderBy: { createdAt: "desc" },
      take: 6
    })
  ]);

  const activeLicense = licenses.find((license) => license.status === LicenseStatus.ACTIVE) ?? licenses[0] ?? null;
  const enabledModules = new Set<ModuleKey>(licenses.flatMap((license) => license.modules.filter((entry) => entry.enabled).map((entry) => entry.module)));
  const activeUsers = users.filter((membership) => membership.status === "ACTIVE").length;
  const pendingInvites = users.filter((membership) => membership.status === "INVITED").length;
  const activatedDevices = devices.filter((device) => device.status === DeviceStatus.ACTIVATED).length;
  const seatCapacity = activeLicense?.modules.reduce((total, module) => total + (module.allocatedSeats ?? 0), 0) ?? 0;
  const seatsUsed = activeLicense?.users.length ?? 0;
  const availableSeats = seatCapacity > 0 ? Math.max(seatCapacity - seatsUsed, 0) : null;
  const inventoryEnabled = enabledModules.has("INVENTORY");
  const inventoryCanOpen = hasPortalModuleAccess(accessSnapshot, "INVENTORY", "VIEW");
  const licensingCanOpen = hasPortalModuleAccess(accessSnapshot, "LICENSING", "VIEW");
  const orgCanOpen = hasPortalModuleAccess(accessSnapshot, "ADMINISTRATION", "VIEW");
  const platformFoundationCount = getPortalModulesByGroup("platform-foundation").length;
  const futureModuleCount = getPortalModulesByGroup("future-module").length;
  const readinessSteps = buildInventoryReadinessSteps({
    organisationReady: Boolean(session.organisation.name && session.organisation.industry && session.organisation.timezone && session.organisation.currency),
    inventoryLicensed: inventoryEnabled,
    inventoryViewAllowed: inventoryCanOpen,
    environmentAllowed: accessSnapshot.environmentAllowed,
    environment: session.environment,
    activeUsers,
    pendingInvites,
    registeredDevices: devices.length,
    activatedDevices,
    workflowShellsReady: inventoryPortalWorkflows.filter((workflow) => Boolean(workflow.slug)).length >= 12,
    importPreparationReady: true
  });
  const readinessSummary = getInventoryReadinessSummary(readinessSteps);
  const nextReadinessStep = readinessSteps.find((step) => step.state === "needs-action") ?? readinessSteps.find((step) => step.state === "optional");

  return (
    <PortalShell session={session}>
      <section className={`environment-banner environment-${session.environment.toLowerCase()}`}>
        <strong>{session.environment}</strong>
        <span>{getEnvironmentCopy(session.environment)}</span>
      </section>

      <section className="hero-card inventory-hero-card">
        <div>
          <p className="eyebrow">Inventory-first customer portal</p>
          <h1>Welcome back, {session.user.displayName}</h1>
          <p>
            {session.organisation.name} · {session.membership.role.name} · {session.organisation.timezone} · {session.organisation.currency}
          </p>
        </div>
        <div className="hero-actions">
          {inventoryCanOpen ? (
            <Link className="primary-link" href="/portal/inventory">Open Inventory</Link>
          ) : (
            <Link className="secondary-link" href="/portal/licensing">Review Inventory Access</Link>
          )}
          <Link className="secondary-link" href="/portal/inventory/readiness">Inventory Readiness</Link>
          <Link className="secondary-link" href="/portal/inventory/setup">Setup Actions</Link>
          <Link className="secondary-link" href="/portal/inventory/imports">Import Preparation</Link>
          {licensingCanOpen ? <Link className="secondary-link" href="/portal/licensing">View Licensing</Link> : null}
          {orgCanOpen ? <Link className="secondary-link" href="/portal/admin/organisation">Organisation Settings</Link> : null}
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-4">
        <article className="metric-card metric-card-primary">
          <span>Available First</span>
          <strong>Inventory</strong>
          <p>{inventoryCanOpen ? "Inventory access available" : inventoryEnabled ? "Inventory role access restricted" : "Inventory licence required"}</p>
        </article>
        <article className="metric-card">
          <span>License</span>
          <strong>{activeLicense?.status ?? "No license"}</strong>
          <p>Expiry: {formatDate(activeLicense?.expiresAt)}</p>
        </article>
        <article className="metric-card">
          <span>Organisation Context</span>
          <strong>{session.organisation.industry || "Industry not set"}</strong>
          <p>{activeUsers} active users · {devices.length} registered devices</p>
        </article>
        <article className="metric-card">
          <span>Environment</span>
          <strong>{session.environment}</strong>
          <p>{session.environment === "LIVE" ? "Real operational inventory" : "Separated from live stock"}</p>
        </article>
      </section>

      <section className="section-heading">
        <div>
          <h2>Available First</h2>
          <p>Inventory is the only active commercial product destination in this portal build.</p>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-3">
        {getPortalModulesByGroup("available-first").map((module) => {
          const visibility = getPortalModuleVisibility(module, accessSnapshot);
          return (
            <article className="module-card module-card-primary" key={module.id}>
              <div className="module-card-header">
                <h3>{module.title}</h3>
                <span className={`status-pill ${getVisibilityClass(visibility)}`}>{getVisibilityLabel(visibility)}</span>
              </div>
              <p>{module.description}</p>
              <p className="module-meta">Access state: {getVisibilityLabel(visibility)}</p>
              {moduleAction(module, visibility)}
            </article>
          );
        })}
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card readiness-card-panel">
          <div className="section-heading compact">
            <div>
              <h2>Inventory Readiness Snapshot</h2>
              <p>Portal context prepared before deeper Inventory backend connection.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left">
            <span>Required: {readinessSummary.completeRequired} / {readinessSummary.requiredTotal}</span>
            <span>Licence: {inventoryEnabled ? "Inventory enabled" : "Needs Inventory entitlement"}</span>
            <span>Role: {session.membership.role.name}</span>
            <span>Environment: {session.environment}</span>
            <span>Devices: {activatedDevices} active</span>
            <span>Seats: {availableSeats === null ? "Unlimited / not set" : `${availableSeats} available`}</span>
          </div>
          <div className="portal-ready-box compact-ready-box">
            <h3>{readinessSummary.readyForShellUse ? "Inventory shell ready" : "Inventory setup needs attention"}</h3>
            <p>{nextReadinessStep ? `Next safe action: ${nextReadinessStep.title}.` : "All immediate setup actions are complete."}</p>
            <Link className="secondary-link" href="/portal/inventory/readiness">Open Readiness Flow</Link>
            <Link className="secondary-link" href="/portal/inventory/setup">Open Setup Actions</Link>
          </div>
        </article>

        <article className="card readiness-card-panel">
          <div className="section-heading compact">
            <div>
              <h2>Portal Build Boundaries</h2>
              <p>This shell does not pretend live Inventory data is connected yet.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left">
            <span>No fake stock totals</span>
            <span>No CRM operational access</span>
            <span>No POS operational access</span>
            <span>Environment visible</span>
            <span>Role and licence aware</span>
            <span>Setup actions preparation-only</span>
            <span>Import uploads disabled</span>
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-3 dashboard-bottom">
        {readinessSteps.slice(0, 3).map((step) => (
          <article className="card readiness-card-panel" key={step.id}>
            <div className="module-card-header">
              <h2>{step.title}</h2>
              <span className={`status-pill ${getInventoryReadinessClass(step.state)}`}>{getInventoryReadinessLabel(step.state)}</span>
            </div>
            <p className="workflow-note">{step.description}</p>
            <Link className="secondary-link readiness-mini-action" href={step.href}>{step.actionLabel}</Link>
          </article>
        ))}
      </section>

      <section className="section-heading">
        <div>
          <h2>Platform Foundations</h2>
          <p>Supporting controls for licensed Inventory customers.</p>
        </div>
        <span className="section-count">{platformFoundationCount} foundations</span>
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
              {moduleAction(module, visibility)}
            </article>
          );
        })}
      </section>

      <section className="section-heading">
        <div>
          <h2>Future Modules</h2>
          <p>Visible roadmap modules only. They are secondary and not operational in this Inventory-first build.</p>
        </div>
        <span className="section-count">{futureModuleCount} future items</span>
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
              {moduleAction(module, visibility)}
            </article>
          );
        })}
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Notifications</h2>
              <p>Recent portal updates and customer actions.</p>
            </div>
          </div>
          {notifications.length ? (
            <div className="activity-list">
              {notifications.map((notification) => (
                <div className="activity-row" key={notification.id}>
                  <strong>{notification.title}</strong>
                  <span>{notification.body}</span>
                  <small>{formatDate(notification.createdAt)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No notifications yet.</p>
          )}
        </article>

        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Recent Activity</h2>
              <p>Read-only summary from the audit foundation.</p>
            </div>
          </div>
          {recentActivity.length ? (
            <div className="activity-list">
              {recentActivity.map((event) => (
                <div className="activity-row" key={event.id}>
                  <strong>{event.action.replaceAll("_", " ")}</strong>
                  <span>{event.module ?? "Platform"} · {event.result}</span>
                  <small>{formatDate(event.createdAt)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No recent activity yet.</p>
          )}
        </article>
      </section>

      <section className="card readiness-card">
        <div>
          <h2>Portal Readiness</h2>
          <p>Inventory-first portal shell is now the customer access direction.</p>
        </div>
        <div className="readiness-list">
          <span>Primary product: Inventory</span>
          <span>Licensing: {activeLicense ? "Present" : "Needs setup"}</span>
          <span>Users: {users.length ? "Ready" : "Invite users"}</span>
          <span>Pending invites: {pendingInvites}</span>
          <span>CRM/POS: Future only</span>
        </div>
      </section>
    </PortalShell>
  );
}
