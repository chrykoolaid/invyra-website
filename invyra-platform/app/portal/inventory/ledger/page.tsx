import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/security/access-control";
import { PortalShell } from "@/components/PortalShell";
import { LedgerClient } from "@/components/inventory/LedgerClient";

function environmentCopy(environment: string) {
  if (environment === "TRAINING") return "Training ledger records remain isolated from LIVE.";
  if (environment === "TEST") return "Test ledger records remain isolated from LIVE.";
  return "LIVE ledger records affect operational stock balances.";
}

export default async function InventoryLedgerPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const canView = await canAccessModule({ session, module: "INVENTORY", level: "VIEW" });
  if (!canView) redirect("/access-denied");
  const canApprove = await canAccessModule({ session, module: "INVENTORY", level: "APPROVE" });
  const role = session.membership.role.name;
  const canTransact = (role === "MANAGER" || role === "ADMINISTRATOR" || role === "OWNER") && canApprove;

  return (
    <PortalShell session={session}>
      <section className={`environment-banner environment-${session.environment.toLowerCase()}`}><strong>{session.environment}</strong><span>{environmentCopy(session.environment)}</span></section>
      <section className="hero-card inventory-hero-card workflow-hero-card">
        <div><p className="eyebrow">Sprint 2</p><h1>Inventory Ledger</h1><p>Opening balances and adjustments create permanent movement records. Direct quantity edits remain prohibited.</p></div>
        <div className="hero-actions"><Link className="secondary-link" href="/portal/inventory">Inventory Dashboard</Link><Link className="secondary-link" href="/portal/inventory/items">Items</Link><span className="status-pill state-enabled">Ledger Foundation</span></div>
      </section>
      <LedgerClient canTransact={canTransact} environment={session.environment} />
    </PortalShell>
  );
}
