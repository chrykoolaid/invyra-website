import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/security/access-control";
import { PortalShell } from "@/components/PortalShell";
import { ReceivingClient } from "@/components/inventory/ReceivingClient";

function environmentCopy(environment: string) {
  if (environment === "TRAINING") return "Training receipts remain isolated from LIVE stock.";
  if (environment === "TEST") return "Test receipts remain isolated from LIVE stock.";
  return "LIVE receipts increase operational stock through the inventory ledger.";
}

export default async function InventoryReceivingPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const canView = await canAccessModule({ session, module: "INVENTORY", level: "VIEW" });
  if (!canView) redirect("/access-denied");
  const canCreate = await canAccessModule({ session, module: "INVENTORY", level: "CREATE" });

  return (
    <PortalShell session={session}>
      <section className={`environment-banner environment-${session.environment.toLowerCase()}`}><strong>{session.environment}</strong><span>{environmentCopy(session.environment)}</span></section>
      <section className="hero-card inventory-hero-card workflow-hero-card">
        <div><p className="eyebrow">Sprint 4</p><h1>Receiving</h1><p>Receive against approved purchase orders. Stock only increases when goods are confirmed as received.</p></div>
        <div className="hero-actions"><Link className="secondary-link" href="/portal/inventory">Inventory Dashboard</Link><Link className="secondary-link" href="/portal/inventory/orders">Purchase Orders</Link><Link className="secondary-link" href="/portal/inventory/ledger">Ledger</Link><span className="status-pill state-enabled">Receiving Foundation</span></div>
      </section>
      <ReceivingClient canReceive={canCreate} environment={session.environment} />
    </PortalShell>
  );
}
