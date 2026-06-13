import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { getPortalModulesByGroup } from "@/lib/portal/module-catalog";
import { PortalShell } from "@/components/PortalShell";

const roadmapModules = getPortalModulesByGroup("future-module").filter((module) => module.status === "roadmap");

function getRoadmapModule(id: string) {
  return roadmapModules.find((module) => module.id === id) ?? null;
}

function getRoadmapCopy(id: string) {
  if (id === "forecasting") {
    return {
      focus: "Demand forecasting, replenishment intelligence, seasonality, and risk explanation after Inventory data is reliable.",
      firstDependency: "Stable Inventory item, movement, reorder, supplier, and sales/usage history contracts.",
      boundary: "No AI forecasting or automated purchase suggestions are active in the portal yet."
    };
  }

  if (id === "purchasing-extensions") {
    return {
      focus: "Deeper approval workflows, supplier collaboration, order confirmation, and delivery communication after core orders are stable.",
      firstDependency: "Operational order, receiving, supplier, discrepancy, and audit workflows.",
      boundary: "No supplier portal submission, supplier confirmation, or live purchasing automation is active here."
    };
  }

  if (id === "payroll") {
    return {
      focus: "Future workforce/payroll capability outside the first Inventory commercial release.",
      firstDependency: "A separate payroll governance, compliance, roster, and employment-data scope.",
      boundary: "No payroll records, payslip generation, payroll compliance, or employee pay calculations are included."
    };
  }

  if (id === "time-tracking") {
    return {
      focus: "Future staff time capture and attendance workflows after Inventory is commercially ready.",
      firstDependency: "A separate workforce, roles, location, roster, and approval workflow scope.",
      boundary: "No clock-in, clock-out, attendance mutation, or timesheet approval is active."
    };
  }

  return {
    focus: "Future integration capability for supported systems after core Inventory workflows are stable.",
    firstDependency: "A separate integration contract, API authentication, audit, retry, and support scope.",
    boundary: "No third-party sync, webhook processing, or live integration mutation is active."
  };
}

export function generateStaticParams() {
  return roadmapModules.map((module) => ({ module: module.id }));
}

export default async function PortalRoadmapModulePage({ params }: { params: { module: string } }) {
  const module = getRoadmapModule(params.module);
  if (!module) notFound();

  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const roadmapCopy = getRoadmapCopy(module.id);

  return (
    <PortalShell session={session}>
      <section className={`environment-banner environment-${session.environment.toLowerCase()}`}>
        <strong>{session.environment}</strong>
        <span>{module.title} is a roadmap capability only and is not operational in this Inventory-first portal.</span>
      </section>

      <section className="hero-card future-hero-card">
        <div>
          <p className="eyebrow">Roadmap Module</p>
          <h1>{module.title}</h1>
          <p>{module.description}</p>
        </div>
        <div className="hero-actions">
          <Link className="primary-link" href="/portal/inventory">Return to Inventory Portal</Link>
          <Link className="secondary-link" href="/portal">Back to Portal Home</Link>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-3">
        <article className="module-card future-module-card">
          <div className="module-card-header">
            <h3>Status</h3>
            <span className="status-pill state-roadmap">Roadmap Module</span>
          </div>
          <p>This page is intentionally informational. It prevents roadmap items from linking into active Inventory workflow routes.</p>
        </article>
        <article className="module-card future-module-card">
          <div className="module-card-header">
            <h3>Current Priority</h3>
            <span className="status-pill state-enabled">Inventory First</span>
          </div>
          <p>Inventory dashboard, setup, workflow shells, environment awareness, and access control remain the active portal priority.</p>
        </article>
        <article className="module-card future-module-card">
          <div className="module-card-header">
            <h3>Access Rule</h3>
            <span className="status-pill state-muted">No Launch</span>
          </div>
          <p>No operational Open button is provided until this module is separately scoped, implemented, licensed, and tested.</p>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid-2 dashboard-bottom">
        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Roadmap Focus</h2>
              <p>What this capability may eventually support.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            <span>{roadmapCopy.focus}</span>
            <span>First dependency: {roadmapCopy.firstDependency}</span>
            <span>Commercial release: not included in the first Inventory portal release</span>
          </div>
        </article>

        <article className="card">
          <div className="section-heading compact">
            <div>
              <h2>Boundary</h2>
              <p>What is deliberately not active yet.</p>
            </div>
          </div>
          <div className="readiness-list readiness-list-left readiness-stack">
            <span>{roadmapCopy.boundary}</span>
            <span>No fake backend data is shown.</span>
            <span>No operational route is exposed from this roadmap page.</span>
            <span>No live customer data mutation is possible from this page.</span>
          </div>
        </article>
      </section>
    </PortalShell>
  );
}
