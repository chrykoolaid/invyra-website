"use client";

import { useEffect, useMemo, useState } from "react";

type ReceivablePO = { id: string; orderNumber: string; status: string; supplierName: string; expectedDate: string | null };
type POLine = { itemId: string; sku: string | null; itemName: string | null; quantityOrdered: string; quantityReceivedToDate: string; quantityRemaining: string };
type ReceivingHistory = { id: string; receiptNumber: string; orderNumber: string | null; status: string; confirmedAt: string | null; createdAt: string };

export function ReceivingClient({ canReceive, environment }: { canReceive: boolean; environment: string }) {
  const [orders, setOrders] = useState<ReceivablePO[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [lines, setLines] = useState<POLine[]>([]);
  const [history, setHistory] = useState<ReceivingHistory[]>([]);
  const [message, setMessage] = useState("");
  const [lineState, setLineState] = useState<Record<string, { quantityReceived: string; discrepancyReason: string }>>({});

  async function load() {
    const [ordersResponse, historyResponse] = await Promise.all([
      fetch("/api/inventory/receivable-purchase-orders", { cache: "no-store" }),
      fetch("/api/inventory/receiving", { cache: "no-store" })
    ]);
    const [ordersPayload, historyPayload] = await Promise.all([ordersResponse.json(), historyResponse.json()]);
    setOrders(ordersPayload?.data?.purchaseOrders ?? []);
    setHistory(historyPayload?.data?.records ?? []);
  }

  async function loadOrder(id: string) {
    setSelectedOrderId(id);
    setLines([]);
    setLineState({});
    if (!id) return;
    const response = await fetch(`/api/inventory/receiving/${id}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setMessage(payload?.error?.message ?? "Unable to load purchase order");
      return;
    }
    const loadedLines: POLine[] = payload.data.purchaseOrder.lines ?? [];
    setLines(loadedLines);
    setLineState(Object.fromEntries(loadedLines.map((line) => [line.itemId, { quantityReceived: line.quantityRemaining, discrepancyReason: "" }])));
  }

  useEffect(() => { load(); }, []);

  const selectedOrder = useMemo(() => orders.find((order) => order.id === selectedOrderId), [orders, selectedOrderId]);

  async function confirmReceipt() {
    if (!canReceive || !selectedOrderId) return;
    setMessage("");
    const body = {
      purchaseOrderId: selectedOrderId,
      hasDiscrepancy: Object.values(lineState).some((line) => line.discrepancyReason.trim().length > 0),
      lines: Object.entries(lineState).map(([itemId, line]) => ({ itemId, quantityReceived: line.quantityReceived, discrepancyReason: line.discrepancyReason }))
    };
    const response = await fetch("/api/inventory/receiving", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setMessage(payload?.error?.message ?? "Receipt failed");
      return;
    }
    setMessage(`Receipt confirmed. Inventory increased through RECEIVING ledger movements only.`);
    await load();
    await loadOrder(selectedOrderId);
  }

  return (
    <section className="card" style={{ marginTop: 16 }}>
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Sprint 4 Receiving Foundation · {environment}</p>
          <h2>Receiving Workspace</h2>
          <p>Approved and sent purchase orders become receivable. Confirmed receipts create immutable RECEIVING ledger movements.</p>
        </div>
        <span className={`status-pill ${canReceive ? "state-enabled" : "state-muted"}`}>{canReceive ? "Receiving Enabled" : "Read Only"}</span>
      </div>

      <div className="readiness-note-grid" style={{ marginBottom: 16 }}>
        <span>PO creation still does not change stock</span>
        <span>Receiving is ledger-backed</span>
        <span>Partial receipts supported</span>
        <span>Discrepancies captured</span>
      </div>

      <div className="workflow-layout-grid" style={{ alignItems: "start" }}>
        <div className="workflow-main-zone">
          <h3>Receivable Purchase Orders</h3>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Select PO</span>
            <select value={selectedOrderId} onChange={(event) => loadOrder(event.target.value)} style={{ padding: 10, border: "1px solid #d9dde7", borderRadius: 10 }}>
              <option value="">Select approved/sent PO</option>
              {orders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber} · {order.supplierName} · {order.status}</option>)}
            </select>
          </label>

          {selectedOrder ? <p><strong>{selectedOrder.orderNumber}</strong> · {selectedOrder.supplierName} · {selectedOrder.status}</p> : null}

          {lines.length ? (
            <div className="inventory-readonly-table-wrap" style={{ marginTop: 12 }}>
              <table className="inventory-readonly-table">
                <thead><tr><th>SKU</th><th>Item</th><th>Ordered</th><th>Received</th><th>Remaining</th><th>Receive Now</th><th>Discrepancy</th></tr></thead>
                <tbody>{lines.map((line) => {
                  const state = lineState[line.itemId] ?? { quantityReceived: "", discrepancyReason: "" };
                  return <tr key={line.itemId}><td>{line.sku ?? "—"}</td><td>{line.itemName ?? "—"}</td><td>{line.quantityOrdered}</td><td>{line.quantityReceivedToDate}</td><td>{line.quantityRemaining}</td><td><input value={state.quantityReceived} onChange={(event) => setLineState((current) => ({ ...current, [line.itemId]: { ...(current[line.itemId] ?? state), quantityReceived: event.target.value } }))} style={{ maxWidth: 90, padding: 8, border: "1px solid #d9dde7", borderRadius: 8 }} /></td><td><input placeholder="Short/damaged/wrong item" value={state.discrepancyReason} onChange={(event) => setLineState((current) => ({ ...current, [line.itemId]: { ...(current[line.itemId] ?? state), discrepancyReason: event.target.value } }))} style={{ padding: 8, border: "1px solid #d9dde7", borderRadius: 8 }} /></td></tr>;
                })}</tbody>
              </table>
            </div>
          ) : <div className="workflow-empty-state-panel phase1f-empty-state-panel" style={{ marginTop: 12 }}><strong>No PO selected</strong><p>Select an approved or sent purchase order to begin receiving.</p></div>}

          {canReceive && lines.length ? <button className="secondary-link" type="button" onClick={confirmReceipt} style={{ marginTop: 12 }}>Confirm Receipt</button> : null}
          {message ? <p><strong>{message}</strong></p> : null}
        </div>

        <aside className="workflow-side-zone">
          <strong>Receiving Governance</strong>
          <p>Full and partial receipts update stock through the ledger. Over-delivery requires Manager, Administrator or Owner authority.</p>
          <ul>
            <li>Receipt Number: generated server-side</li>
            <li>Movement Type: RECEIVING</li>
            <li>PO Status: Partially Received or Received</li>
            <li>Audit: receipt event recorded</li>
          </ul>
        </aside>
      </div>

      <h3 style={{ marginTop: 22 }}>Receiving History</h3>
      <div className="inventory-readonly-table-wrap">
        <table className="inventory-readonly-table">
          <thead><tr><th>Receipt</th><th>PO</th><th>Status</th><th>Confirmed</th><th>Created</th></tr></thead>
          <tbody>{history.map((receipt) => <tr key={receipt.id}><td>{receipt.receiptNumber}</td><td>{receipt.orderNumber ?? "—"}</td><td>{receipt.status}</td><td>{receipt.confirmedAt ? new Date(receipt.confirmedAt).toLocaleString() : "—"}</td><td>{new Date(receipt.createdAt).toLocaleString()}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
