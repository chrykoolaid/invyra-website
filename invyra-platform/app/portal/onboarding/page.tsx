import Link from "next/link";
import { redirect } from "next/navigation";
import { DeviceStatus, LicenseStatus } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getOrganisationProfile } from "@/lib/organisations/organisation-management";
import { listLicenses } from "@/lib/licensing/licensing-management";
import { getCurrentOnboardingWorkflow } from "@/lib/onboarding/onboarding-management";
import { inventoryPortalWorkflows } from "@/lib/portal/module-catalog";
import {
  buildInventoryReadinessSteps,
  getInventoryReadinessClass,
  getInventoryReadinessLabel,
  getInventoryReadinessSummary
} from "@/lib/portal/inventory-readiness";
import { getPortalAccessSnapshot, hasPortalModuleAccess } from "@/lib/portal/portal-access";
import { PortalShell } from "@/components/PortalShell";

function formatDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "Not set";
}

function formatStatus(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "Not started";
}

function getStepState(done: boolean) {
  return done ? "Complete" : "Needs attention";
}

export default async function PortalOnboardingPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const [org, licenses, devices, workflow] = await Promise.all([
    getOrganisationProfile(session),
    listLicenses(session),
    prisma.device.findMany({
      where: { organisationId: session.organisation.id },
      orderBy: { createdAt: "desc" }
    }),
    getCurrentOnboardingWorkflow(session)
  ]);

  if (!org) redirect("/access-denied");

  const accessSnapshot = await getPortalAccessSnapshot(session);
  const activeLicense = licenses.find((license) => license.status === LicenseStatus.ACTIVE) ?? licenses[0] ?? null;
  const activeUsers = org.memberships.filter((membership) => membership.status === "ACTIVE").length;
  const invitedUsers = org.memberships.filter((membership) => membership.status === "INVITED").length;
  const activeDevices = devices.filter((device) => device.status === DeviceStatus.ACTIVATED).length;
  const enabledModules = activeLicense?.modules.filter((module) => module.enabled).length ?? 0;
  const enabledModuleSet = new Set((activeLicense?.modules ?? []).filter((module) => module.enabled).map((module) => module.module));
  const inventoryEnabled = enabledModuleSet.has("INVENTORY");

  const organisationReady = Boolean(org.name && org.industry && org.timezone && org.currency);
  const usersReady = activeUsers > 0;
  const licenseReady = Boolean(activeLicense && activeLicense.status === LicenseStatus.ACTIVE);
  const modulesReady = enabledModules > 0;
  const portalReady = organisationReady && usersReady && licenseReady;

  const readinessItems = [
    {
      label: "Verify organisation",
      description: "Confirm business profile, industry, timezone, and currency.",
      status: getStepState(organisationReady),
      href: "/portal/admin/organisation",
      action: "Review Organisation",
      done: organisationReady
    },
    {
      label: "Invite team",
      description: "Add users and assign customer-safe portal roles.",
      status: getStepState(usersReady),
      href: "/portal/admin/users",
      action: "Manage Users",
      done: usersReady
    },
    {
      label: "Review licenses",
      description: "Check plan status, module access, seats, and devices.",
      status: getStepState(licenseReady),
      href: "/portal/licensing",
      action: "View Licensing",
      done: licenseReady
    },
    {
      label: "Check module readiness",
      description: "See which modules are enabled, early access, or not licensed.",
      status: getStepState(modulesReady),
      href: "/portal",
      action: "Open Launcher",
      done: modulesReady
    },
    {
      label: "Portal ready",
      description: "Return to the customer command center once essentials are complete.",
      status: getStepState(portalReady),
      href: "/portal",
      action: "Go to Portal",
      done: portalReady
    }
  ];

  const completedCount = readinessItems.filter((item) => item.done).length;
  const inventoryReadinessSteps = buildInventoryReadinessSteps({
    organisationReady,
    inventoryLicensed: inventoryEnabled,
    inventoryViewAllowed: hasPortalModuleAccess(accessSnapshot, "INVENTORY", "VIEW"),
    environmentAllowed: accessSnapshot.environmentAllowed,
    environment: session.environment,
    activeUsers,
    pendingInvites: invitedUsers,
    registeredDevices: devices.length,
    activatedDevices: activeDevices,
    workflowShellsReady: inventoryPortalWorkflows.filter((item) => Boolean(item.slug)).length >= 12
  });
  const inventoryReadinessSummary = getInventoryReadinessSummary(inventoryReadinessSteps);

  return (
    <PortalShell session={session}>
      <section className="hero-card onboarding-hero">
        <div>
          <p className="eyebrow">First Login Experience</p>
          <h1>Welcome to Invyra</h1>
          <p>
            Complete the essentials for {org.name}: verify the organisation, invite the team, review licenses, and confirm portal readiness.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="secondary-link" href="/portal">Back to Portal</Link>
          <Link className="secondary-link" href="/portal/inventory/readiness">Inventory Readiness</Link>
          <Link className="primary-link" href={portalReady ? "/portal" : "/portal/admin/organisation"}>
            {portalReady ? "Portal Ready" : "Start Setup"}
          </Link>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-4">
        <article className="metric-card">
          <span>Readiness</span>
          <strong>{completedCount} / {readinessItems.length}</strong>
          <p>{portalReady ? "Portal ready" : "Setup in progress"}</p>
        </article>
        <article className="metric-card">
          <span>Organisation</span>
          <strong>{organisationReady ? "Verified" : "Review"}</strong>
          <p>{org.industry ?? "Industry not set"} · {org.currency}</p>
        </article>
        <article className="metric-card">
          <span>Users</span>
          <strong>{activeUsers}</strong>
          <p>{invitedUsers} pending invites</p>
        </article>
        <article className="metric-card">
          <span>License</span>
          <strong>{activeLicense?.status ?? "Missing"}</strong>
          <p>Expiry: {formatDate(activeLicense?.expiresAt)}</p>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card onboarding-panel inventory-readiness-panel">
          <div className="section-heading compact">
            <div>
              <h2>Inventory Readiness Flow</h2>
              <p>Inventory-specific setup before live item, stock, supplier, order, and receiving data are connected.</p>
            </div>
            <span className={`status-pill ${inventoryReadinessSummary.readyForShellUse ? "state-enabled" : "state-early"}`}>
              {inventoryReadinessSummary.completeRequired} / {inventoryReadinessSummary.requiredTotal}
            </span>
          </div>
          <div className="readiness-note-grid">
            {inventoryReadinessSteps.slice(0, 6).map((step) => (
              <span className={getInventoryReadinessClass(step.state)} key={step.id}>
                {step.title}: {getInventoryReadinessLabel(step.state)}
              </span>
            ))}
          </div>
          <div className="portal-ready-box compact-ready-box">
            <h3>{inventoryReadinessSummary.readyForShellUse ? "Inventory shell ready" : "Inventory setup needs attention"}</h3>
            <p>Use the Inventory readiness flow to separate customer setup from future backend integration work.</p>
            <Link className="secondary-link" href="/portal/inventory/readiness">Open Inventory Readiness</Link>
          </div>
        </article>

        <article className="card onboarding-panel">
          <div className="section-heading compact">
            <div>
              <h2>Inventory Empty State Policy</h2>
              <p>First login can prepare the customer without showing fake operating records.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            <span>No sample stock totals</span>
            <span>No sample supplier rows</span>
            <span>No fake purchase orders</span>
            <span>No fabricated reports</span>
            <span>Backend data connection deferred</span>
            <span>CRM/POS future only</span>
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card onboarding-panel">
          <div className="section-heading compact">
            <div>
              <h2>First Login Wizard</h2>
              <p>Customer-safe setup path with clear actions and no developer terminology.</p>
            </div>
          </div>
          <div className="onboarding-steps">
            {readinessItems.map((item, index) => (
              <div className="onboarding-step" key={item.label}>
                <div className={`step-number ${item.done ? "step-complete" : ""}`}>{index + 1}</div>
                <div>
                  <h3>{item.label}</h3>
                  <p>{item.description}</p>
                  <span className={`status-pill ${item.done ? "state-enabled" : "state-early"}`}>{item.status}</span>
                </div>
                <Link className="secondary-link" href={item.href}>{item.action}</Link>
              </div>
            ))}
          </div>
        </article>

        <article className="card onboarding-panel">
          <div className="section-heading compact">
            <div>
              <h2>Portal Readiness Summary</h2>
              <p>Simple operating status for the customer portal.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            <span>Organisation: {organisationReady ? "Configured" : "Needs review"}</span>
            <span>Users: {usersReady ? `${activeUsers} active` : "Invite first user"}</span>
            <span>Licensing: {licenseReady ? "Active" : "Needs license"}</span>
            <span>Modules: {modulesReady ? `${enabledModules} enabled` : "No modules enabled"}</span>
            <span>Devices: {devices.length ? `${activeDevices} active / ${devices.length} registered` : "Optional setup pending"}</span>
            <span>Environment: {session.environment}</span>
          </div>
          <div className="portal-ready-box">
            <h3>{portalReady ? "Portal Ready" : "Portal Setup In Progress"}</h3>
            <p>
              {portalReady
                ? "The organisation can use the customer portal. Inventory is the active first product, while CRM and POS can plug into this same gateway later when explicitly scoped."
                : "Complete the highlighted actions to make the portal ready for everyday customer use."}
            </p>
            <Link className="primary-link" href="/portal">Go to Portal</Link>
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Onboarding Workflow</h2>
              <p>Operational workflow status from the Wave 5 onboarding foundation.</p>
            </div>
          </div>
          {workflow ? (
            <div className="activity-list">
              <div className="activity-row">
                <strong>{formatStatus(workflow.status)}</strong>
                <span>Started: {workflow.startedAt.toLocaleString()}</span>
                <small>Completed: {formatDate(workflow.completedAt)}</small>
              </div>
              {workflow.steps.map((step) => (
                <div className="activity-row" key={step.id}>
                  <strong>{step.order}. {step.label}</strong>
                  <span>{formatStatus(step.status)}</span>
                  <small>{formatDate(step.completedAt)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No formal onboarding workflow has been created yet. The readiness checklist above still guides first setup.</p>
          )}
        </article>

        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Inventory-first Module Readiness</h2>
              <p>Inventory is the active product. CRM and POS remain roadmap modules until explicitly scoped.</p>
            </div>
          </div>
          <table className="table">
            <thead><tr><th>Module</th><th>Status</th><th>Next Step</th></tr></thead>
            <tbody>
              <tr><td>Inventory</td><td>{inventoryEnabled ? "Available first / gated" : "Inventory licence required"}</td><td>Open Inventory Portal</td></tr>
              <tr><td>CRM</td><td>Future Module</td><td>View roadmap only</td></tr>
              <tr><td>POS</td><td>Future Module</td><td>View roadmap only</td></tr>
              <tr><td>Forecasting</td><td>Roadmap Module</td><td>Future Inventory extension</td></tr>
            </tbody>
          </table>
        </article>
      </section>
    </PortalShell>
  );
}
