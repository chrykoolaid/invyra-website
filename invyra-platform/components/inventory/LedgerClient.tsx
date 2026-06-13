"use client";

import { useEffect, useMemo, useState } from "react";

type ItemRecord = { id: string; sku: string; name: string; unitOfMeasure: string; status: string };
type BalanceRecord = { id: string; itemId: string; itemSku: string | null; itemName: string | null; locationName: string | null; quantityOnHand: string; unitOfMeasure: string | null; updatedAt: string };
type MovementRecord = { id: string; itemSku: string | null; itemName: string | null; locationName: string | null; movementType: string; quantityDelta: string; quantityBefore: string | null; quantityAfter: string | null; referenceType: string | null; reason: string | null; createdAt: string };

export function LedgerClient({ canTransact, environment }: { canTransact: boolean; environment: string }) {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [balances, setBalances] = useState<BalanceRecord[]>([]);
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [opening, setOpening] = useState({ itemId: "", quantity: "", reason: "Initial opening balance" });
  const [adjustment, setAdjustment] = useState({ itemId: "", quantityDelta: "", reason: "Count Correction" });
  const [message, setMessage] = useState("");

  async function load() {
    const [itemsResponse, balancesResponse, movementsResponse] = await Promise.all([
      fetch("/api/inventory/items", { cache: "no-store" }),
      fetch("/api/inventory/stock-balances", { cache: "no-store" }),
      fetch("/api/inventory/movements", { cache: "no-store" })
    ]);
    const [itemsPayload, balancesPayload, movementsPayload] = await Promise.all([
      itemsResponse.json(),
      balancesResponse.json(),
      movementsResponse.json()
    ]);
    setItems((itemsPayload?.data?.records ?? []).filter((item: ItemRecord) => item.status !== "ARCHIVED"));
    setBalances(balancesPayload?.data?.records ?? []);
    setMovements(movementsPayload?.data?.records ?? []);
  }

  useEffect(() => { load(); }, []);

  const itemOptions = useMemo(() => items.map((item) => <option key={item.id} value={item.id}>{item.sku} — {item.name}</option>), [items]);

  async function post(endpoint: string, body: Record<string, string>) {
    if (!canTransact) return;
    setMessage("");
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setMessage(payload?.error?.message ?? "Transaction failed");
      return;
    }
    setMessage("Ledger movement created. Stock balance recalculated from the ledger.");
    setOpening({ itemId: "", quantity: "", reason: "Initial opening balance" });
    setAdjustment({ itemId: "", quantityDelta: "", reason: "Count Correction" });
    await load();
  }

  return (
    <section className="card" style={{ marginTop: 16 }}>
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Sprint 2 Ledger Foundation · {environment}</p>
          <h2>Inventory Ledger</h2>
          <p>Opening balances and manual adjustments now create immutable movement rows. Stock is calculated from the ledger, not edited directly.</p>
        </div>
        <span className={`status-pill ${canTransact ? "state-enabled" : "state-muted"}`}>{canTransact ? "Ledger Posting Enabled" : "Read Only"}</span>
      </div>

      <div className="readiness-note-grid" style={{ marginBottom: 16 }}>
        <span>Opening balance once per item/location</span>
        <span>Reason required for adjustments</span>
        <span>Negative stock blocked</span>
        <span>Ledger rows immutable</span>
      </div>

      {canTransact ? (
        <div className="workflow-layout-grid" style={{ alignItems: "start" }}>
          <div className="workflow-main-zone">
            <h3>Opening Balance</h3>
            <p>Create the first stock quantity for an item. Duplicate opening balances are blocked.</p>
            <div className="dashboard-grid dashboard-grid-2">
              <label style={{ display: "grid", gap: 6 }}><span>Item *</span><select value={opening.itemId} onChange={(event) => setOpening((current) => ({ ...current, itemId: event.target.value }))} style={{ padding: 10, border: "1px solid #d9dde7", borderRadius: 10 }}><option value="">Select item</option>{itemOptions}</select></label>
              <Field label="Quantity *" value={opening.quantity} onChange={(value) => setOpening((current) => ({ ...current, quantity: value }))} />
              <Field label="Reason" value={opening.reason} onChange={(value) => setOpening((current) => ({ ...current, reason: value }))} />
            </div>
            <button className="secondary-link" type="button" onClick={() => post("/api/inventory/opening-balances", opening)} style={{ marginTop: 12 }}>Create Opening Balance</button>
          </div>

          <aside className="workflow-side-zone">
            <strong>Manual Adjustment</strong>
            <p>Use adjustments after opening balance. Positive and negative corrections are allowed when they do not create negative stock.</p>
            <label style={{ display: "grid", gap: 6 }}><span>Item *</span><select value={adjustment.itemId} onChange={(event) => setAdjustment((current) => ({ ...current, itemId: event.target.value }))} style={{ padding: 10, border: "1px solid #d9dde7", borderRadius: 10 }}><option value="">Select item</option>{itemOptions}</select></label>
            <Field label="Adjustment Qty *" value={adjustment.quantityDelta} onChange={(value) => setAdjustment((current) => ({ ...current, quantityDelta: value }))} />
            <Field label="Reason *" value={adjustment.reason} onChange={(value) => setAdjustment((current) => ({ ...current, reason: value }))} />
            <button className="secondary-link" type="button" onClick={() => post("/api/inventory/adjustments", adjustment)} style={{ marginTop: 12 }}>Post Adjustment</button>
            {message ? <p><strong>{message}</strong></p> : null}
          </aside>
        </div>
      ) : (
        <div className="workflow-empty-state-panel phase1f-empty-state-panel"><strong>Read-only role</strong><p>Your role can view the ledger but cannot post opening balances or adjustments.</p></div>
      )}

      <h3 style={{ marginTop: 22 }}>Current Stock Balances</h3>
      <div className="inventory-readonly-table-wrap">
        <table className="inventory-readonly-table">
          <thead><tr><th>SKU</th><th>Item</th><th>Location</th><th>Qty On Hand</th><th>Unit</th><th>Updated</th></tr></thead>
          <tbody>{balances.map((balance) => <tr key={balance.id}><td>{balance.itemSku ?? "—"}</td><td>{balance.itemName ?? "—"}</td><td>{balance.locationName ?? "—"}</td><td>{balance.quantityOnHand}</td><td>{balance.unitOfMeasure ?? "—"}</td><td>{new Date(balance.updatedAt).toLocaleString()}</td></tr>)}</tbody>
        </table>
      </div>

      <h3 style={{ marginTop: 22 }}>Movement Ledger</h3>
      <div className="inventory-readonly-table-wrap">
        <table className="inventory-readonly-table">
          <thead><tr><th>Date</th><th>SKU</th><th>Item</th><th>Type</th><th>Before</th><th>Delta</th><th>After</th><th>Reason</th></tr></thead>
          <tbody>{movements.map((movement) => <tr key={movement.id}><td>{new Date(movement.createdAt).toLocaleString()}</td><td>{movement.itemSku ?? "—"}</td><td>{movement.itemName ?? "—"}</td><td>{movement.movementType}</td><td>{movement.quantityBefore ?? "—"}</td><td>{movement.quantityDelta}</td><td>{movement.quantityAfter ?? "—"}</td><td>{movement.reason ?? "—"}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label style={{ display: "grid", gap: 6 }}><span>{label}</span><input value={value ?? ""} onChange={(event) => onChange(event.target.value)} style={{ padding: 10, border: "1px solid #d9dde7", borderRadius: 10 }} /></label>;
}
