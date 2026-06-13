import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { PortalShell } from "@/components/PortalShell";

export default async function PosFutureModulePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  return (
    <PortalShell session={session}>
      <section className={`environment-banner environment-${session.environment.toLowerCase()}`}>
        <strong>{session.environment}</strong>
        <span>POS is a roadmap module and is not operational in the Inventory-first commercial portal.</span>
      </section>

      <section className="hero-card future-hero-card">
        <div>
          <p className="eyebrow">Future Module</p>
          <h1>Point of Sale is coming later</h1>
          <p>
            The current portal must not imply POS is ready for commercial customer access. POS remains secondary until Inventory reaches sellable readiness.
          </p>
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
            <span className="status-pill state-future">Coming Later</span>
          </div>
          <p>POS is not part of the first Inventory commercial portal release.</p>
        </article>
        <article className="module-card future-module-card">
          <div className="module-card-header">
            <h3>Current Priority</h3>
            <span className="status-pill state-enabled">Inventory First</span>
          </div>
          <p>Inventory customer access, environment awareness, licensing, and portal workflows come first.</p>
        </article>
        <article className="module-card future-module-card">
          <div className="module-card-header">
            <h3>Access Rule</h3>
            <span className="status-pill state-muted">No Launch</span>
          </div>
          <p>No POS Open button is provided until POS is commercially scoped and implementation-ready.</p>
        </article>
      </section>
    </PortalShell>
  );
}
