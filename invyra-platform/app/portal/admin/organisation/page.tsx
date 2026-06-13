import Link from "next/link";
import { redirect } from "next/navigation";
import { DeviceStatus } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getOrganisationProfile } from "@/lib/organisations/organisation-management";
import { canAccessModule } from "@/lib/security/access-control";
import { listLicenses } from "@/lib/licensing/licensing-management";
import { PortalShell } from "@/components/PortalShell";

function formatDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "Not set";
}

function statusLabel(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "Not set";
}

export default async function OrganisationPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "ADMINISTRATION", level: "VIEW" });
  if (!allowed) redirect("/access-denied");

  const org = await getOrganisationProfile(session);
  if (!org) redirect("/access-denied");

  const [licenses, devices, recentSecurityEvents] = await Promise.all([
    listLicenses(session),
    prisma.device.findMany({
      where: { organisationId: session.organisation.id },
      orderBy: { createdAt: "desc" }
    }),
    prisma.auditLog.findMany({
      where: { organisationId: session.organisation.id },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  const activeUsers = org.memberships.filter((membership) => membership.status === "ACTIVE").length;
  const pendingUsers = org.memberships.filter((membership) => membership.status === "INVITED").length;
  const activeLicense = licenses.find((license) => license.status === "ACTIVE") ?? licenses[0] ?? null;
  const activeDevices = devices.filter((device) => device.status === DeviceStatus.ACTIVATED).length;
  const pendingDevices = devices.filter((device) => device.status === DeviceStatus.PENDING).length;
  const roleCount = new Set(org.memberships.map((membership) => membership.role.name)).size;

  return (
    <PortalShell session={session}>
      <section className="hero-card">
        <div>
          <p className="eyebrow">Organisation Center</p>
          <h1>{org.name}</h1>
          <p>
            {org.industry ?? "Industry not set"} · {org.timezone} · {org.currency} · {statusLabel(org.status)}
          </p>
        </div>
        <div className="hero-actions">
          <Link className="secondary-link" href="/portal">Back to Portal</Link>
          <Link className="primary-link" href="/portal/admin/users">Manage Users</Link>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-4">
        <article className="metric-card">
          <span>Users</span>
          <strong>{activeUsers}</strong>
          <p>{pendingUsers} pending invites · {roleCount} configured roles</p>
        </article>
        <article className="metric-card">
          <span>License</span>
          <strong>{activeLicense?.status ?? "No license"}</strong>
          <p>Expiry: {formatDate(activeLicense?.expiresAt)}</p>
        </article>
        <article className="metric-card">
          <span>Devices</span>
          <strong>{activeDevices} active</strong>
          <p>{devices.length} registered · {pendingDevices} pending</p>
        </article>
        <article className="metric-card">
          <span>Security</span>
          <strong>{recentSecurityEvents.length}</strong>
          <p>Recent organisation events</p>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Organisation Overview</h2>
              <p>Customer-facing business profile and ownership summary.</p>
            </div>
          </div>
          <table className="table">
            <tbody>
              <tr><th>Business name</th><td>{org.name}</td></tr>
              <tr><th>Legal name</th><td>{org.legalName ?? "Not set"}</td></tr>
              <tr><th>Trading name</th><td>{org.tradingName ?? "Not set"}</td></tr>
              <tr><th>Industry</th><td>{org.industry ?? "Not set"}</td></tr>
              <tr><th>Country</th><td>{org.country}</td></tr>
              <tr><th>Timezone</th><td>{org.timezone}</td></tr>
              <tr><th>Currency</th><td>{org.currency}</td></tr>
              <tr><th>Owner</th><td>{org.owner.displayName} · {org.owner.email}</td></tr>
            </tbody>
          </table>
        </article>

        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Organisation Health</h2>
              <p>Simple readiness indicators for customer administrators.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left">
            <span>Profile: {org.industry ? "Configured" : "Needs industry"}</span>
            <span>License: {activeLicense ? "Visible" : "Needs setup"}</span>
            <span>Users: {org.memberships.length ? "Ready" : "Invite users"}</span>
            <span>Devices: {devices.length ? "Registered" : "Device setup pending"}</span>
            <span>Environment: {session.environment}</span>
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>User Management</h2>
              <p>Users, roles, and account status in one customer-friendly view.</p>
            </div>
            <Link className="secondary-link" href="/portal/admin/users">Open Users</Link>
          </div>
          <table className="table">
            <thead><tr><th>User</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {org.memberships.slice(0, 6).map((membership) => (
                <tr key={membership.id}>
                  <td>{membership.user.displayName}<br /><span className="table-muted">{membership.user.email}</span></td>
                  <td>{statusLabel(membership.role.name)}</td>
                  <td>{statusLabel(membership.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Device Summary</h2>
              <p>Registered terminals, scanners, tablets, and workstations.</p>
            </div>
            <Link className="secondary-link" href="/portal/devices">Open Devices</Link>
          </div>
          <table className="table">
            <thead><tr><th>Device</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {devices.length ? devices.slice(0, 6).map((device) => (
                <tr key={device.id}>
                  <td>{device.deviceName}<br /><span className="table-muted">{device.assignedLocation ?? "Unassigned"}</span></td>
                  <td>{statusLabel(device.deviceType)}</td>
                  <td>{statusLabel(device.status)}</td>
                </tr>
              )) : <tr><td colSpan={3}>No devices registered yet.</td></tr>}
            </tbody>
          </table>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Environment Controls</h2>
              <p>LIVE, TRAINING, and TEST visibility remains separated.</p>
            </div>
            <Link className="secondary-link" href="/portal/admin/environments">Open Environments</Link>
          </div>
          <table className="table">
            <thead><tr><th>Environment</th><th>Status</th><th>Label</th></tr></thead>
            <tbody>
              {org.environmentSettings.length ? org.environmentSettings.map((setting) => (
                <tr key={setting.id}>
                  <td>{setting.environment}</td>
                  <td>{setting.enabled ? "Enabled" : "Disabled"}</td>
                  <td>{setting.visibleLabel ?? "Default"}</td>
                </tr>
              )) : <tr><td colSpan={3}>Default environment settings active.</td></tr>}
            </tbody>
          </table>
        </article>

        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Security Summary</h2>
              <p>Recent login, permission, and administration events.</p>
            </div>
            <Link className="secondary-link" href="/portal/admin/security">Open Security</Link>
          </div>
          {recentSecurityEvents.length ? (
            <div className="activity-list">
              {recentSecurityEvents.map((event) => (
                <div className="activity-row" key={event.id}>
                  <strong>{event.action.replaceAll("_", " ")}</strong>
                  <span>{event.module ?? "Platform"} · {event.result}</span>
                  <small>{formatDate(event.createdAt)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No recent security events yet.</p>
          )}
        </article>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="section-heading compact">
          <div>
            <h2>Organisation Settings</h2>
            <p>Custom settings remain visible without exposing developer-only terminology.</p>
          </div>
        </div>
        <table className="table">
          <thead><tr><th>Setting</th><th>Value</th></tr></thead>
          <tbody>
            {org.settings.length ? org.settings.map((setting) => (
              <tr key={setting.id}><td>{setting.key}</td><td>{setting.value}</td></tr>
            )) : <tr><td colSpan={2}>No custom settings yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </PortalShell>
  );
}
