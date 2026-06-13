import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/security/access-control";
import { PortalShell } from "@/components/PortalShell";
import { getInventoryLossDashboard, listInventoryLossEvents, listInventoryMarkdownEvents } from "@/lib/inventory/inventory-loss-service";

export default async function InventoryLossManagementPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const allowed = await canAccessModule({ session, module: "INVENTORY", level: "VIEW" });
  if (!allowed) redirect("/access-denied");

  const [dashboard, lossEvents, markdowns] = await Promise.all([
    getInventoryLossDashboard(session),
    listInventoryLossEvents(session),
    listInventoryMarkdownEvents(session)
  ]);

  return (
    <PortalShell activeModule="INVENTORY" activeItem="loss-management">
      <section className="portal-page-header">
        <span className="eyebrow">Sprint 6 operational subsystem</span>
        <h1>Waste, Damage, Expiry & Markdown Engine</h1>
        <p>
          Track loss, markdown recovery, expiry risk, damage disposition and shrinkage without allowing unexplained stock disappearance.
        </p>
      </section>

      <section className="inventory-kpi-grid">
        <article className="card"><span>Total loss value</span><strong>₱{dashboard.totalLossValue}</strong></article>
        <article className="card"><span>Waste value</span><strong>₱{dashboard.wasteValue}</strong></article>
        <article className="card"><span>Damage value</span><strong>₱{dashboard.damageValue}</strong></article>
        <article className="card"><span>Expiry loss</span><strong>₱{dashboard.expiryLoss}</strong></article>
        <article className="card"><span>Shrinkage value</span><strong>₱{dashboard.shrinkageValue}</strong></article>
        <article className="card"><span>Markdown recovery</span><strong>₱{dashboard.markdownRecovery}</strong></article>
      </section>

      <section className="card">
        <div className="section-heading compact">
          <div>
            <h2>Loss events</h2>
            <p>Wastage, damage, expiry and shrinkage are ledger-controlled and audit logged.</p>
          </div>
          <span className="status-pill state-enabled">Ledger controlled</span>
        </div>
        <div className="inventory-readonly-table-wrap">
          <table className="inventory-readonly-table">
            <thead><tr><th>Loss #</th><th>Type</th><th>Item</th><th>Location</th><th>Qty</th><th>Value</th><th>Reason</th><th>Status</th></tr></thead>
            <tbody>
              {lossEvents.length ? lossEvents.map((event) => (
                <tr key={event.id}>
                  <td>{event.lossNumber}</td><td>{event.lossType}</td><td>{event.itemName ?? event.itemSku ?? "—"}</td><td>{event.locationName ?? "—"}</td><td>{event.quantity}</td><td>{event.lossValue ?? "—"}</td><td>{event.reason}</td><td>{event.status}</td>
                </tr>
              )) : <tr><td colSpan={8}>No loss events recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="section-heading compact">
          <div>
            <h2>Markdown monitor sheet</h2>
            <p>Operational markdown report for near-expiry and clearance review. Label architecture includes reduced price plus replacement barcode.</p>
          </div>
          <span className="status-pill state-foundation">Printable report ready</span>
        </div>
        <div className="inventory-readonly-table-wrap">
          <table className="inventory-readonly-table">
            <thead><tr><th>Markdown #</th><th>Item</th><th>Original</th><th>Markdown</th><th>%</th><th>Qty Remaining</th><th>Expiry</th><th>Replacement Barcode</th></tr></thead>
            <tbody>
              {markdowns.length ? markdowns.map((markdown) => (
                <tr key={markdown.id}>
                  <td>{markdown.markdownNumber}</td><td>{markdown.itemName ?? markdown.itemSku ?? "—"}</td><td>{markdown.originalPrice}</td><td>{markdown.markdownPrice}</td><td>{markdown.markdownPercent ?? "—"}</td><td>{markdown.quantityRemaining}</td><td>{markdown.expiryDate ? markdown.expiryDate.slice(0, 10) : "—"}</td><td>{markdown.replacementBarcode ?? "—"}</td>
                </tr>
              )) : <tr><td colSpan={8}>No markdowns recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="demo-ux-review-note"><strong>Locked POS safety rule:</strong> Expired items must be blocked from sale even when a markdown label exists.</div>
      </section>
    </PortalShell>
  );
}
