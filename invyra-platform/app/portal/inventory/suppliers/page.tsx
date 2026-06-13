import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/security/access-control";
import { PortalShell } from "@/components/PortalShell";
import { MasterDataClient } from "@/components/inventory/MasterDataClient";

function environmentCopy(environment: string) {
  if (environment === "TRAINING") return "Training supplier records remain isolated from LIVE.";
  if (environment === "TEST") return "Test supplier records remain isolated from LIVE.";
  return "LIVE supplier records are operational master data.";
}

export default async function InventorySuppliersPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const canView = await canAccessModule({ session, module: "INVENTORY", level: "VIEW" });
  if (!canView) redirect("/access-denied");
  const canCreate = await canAccessModule({ session, module: "INVENTORY", level: "CREATE" });
  const canEdit = await canAccessModule({ session, module: "INVENTORY", level: "EDIT" });
  const canAdminister = await canAccessModule({ session, module: "INVENTORY", level: "ADMINISTER" });
  const role = session.membership.role.name;
  const canWrite = (role === "MANAGER" || role === "ADMINISTRATOR" || role === "OWNER") && (canCreate || canEdit);
  const canArchive = (role === "ADMINISTRATOR" || role === "OWNER") && canAdminister;

  return (
    <PortalShell session={session}>
      <section className={`environment-banner environment-${session.environment.toLowerCase()}`}><strong>{session.environment}</strong><span>{environmentCopy(session.environment)}</span></section>
      <section className="hero-card inventory-hero-card workflow-hero-card">
        <div><p className="eyebrow">Sprint 1B</p><h1>Suppliers</h1><p>Operational supplier master data with role-gated writes, archive governance and audit logging.</p></div>
        <div className="hero-actions"><Link className="secondary-link" href="/portal/inventory">Inventory Dashboard</Link><Link className="secondary-link" href="/portal/inventory/items">Items</Link><span className="status-pill state-enabled">Master Data Writes</span></div>
      </section>
      <MasterDataClient mode="suppliers" canWrite={canWrite} canArchive={canArchive} environment={session.environment} />
    </PortalShell>
  );
}
