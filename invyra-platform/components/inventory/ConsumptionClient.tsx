"use client";

import { useEffect, useState } from "react";

type ConsumptionEvent = { id: string; consumptionNumber: string; sourceType: string; status: string; costCenter: string | null; location: string | null; lineCount: number; totalCost: string | null; reason: string; createdAt: string };
type Dashboard = { eventCount: number; lineCount: number; costCenterCount: number; templateCount: number; totalCost: string; ledgerRule: string };

export function ConsumptionClient({ canCreate, environment }: { canCreate: boolean; environment: string }) {
  const [events, setEvents] = useState<ConsumptionEvent[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const [eventsResponse, dashboardResponse] = await Promise.all([
      fetch("/api/inventory/consumption-events", { cache: "no-store" }),
      fetch("/api/inventory/consumption-dashboard", { cache: "no-store" })
    ]);
    const [eventsPayload, dashboardPayload] = await Promise.all([eventsResponse.json(), dashboardResponse.json()]);
    setEvents(eventsPayload?.data?.consumptionEvents ?? []);
    setDashboard(dashboardPayload?.data?.dashboard ?? null);
  }

  useEffect(() => { load(); }, []);

  return (
    <section className="card" style={{ marginTop: 16 }}>
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Sprint 7 Consumption · {environment}</p>
          <h2>Consumption & Cost Centers</h2>
          <p>Internal usage is tracked separately from sales and waste. Confirmed usage creates STORE_USE ledger movements only.</p>
        </div>
        <span className={`status-pill ${canCreate ? "state-enabled" : "state-muted"}`}>{canCreate ? "Consumption Enabled" : "Read Only"}</span>
      </div>
      <div className="dashboard-grid dashboard-grid-4 dashboard-bottom">
        <article className="metric-card"><span>Consumption Events</span><strong>{dashboard?.eventCount ?? 0}</strong><p>Manual or template-based usage</p></article>
        <article className="metric-card"><span>Consumption Lines</span><strong>{dashboard?.lineCount ?? 0}</strong><p>Inventory components consumed</p></article>
        <article className="metric-card"><span>Cost Centers</span><strong>{dashboard?.costCenterCount ?? 0}</strong><p>Usage accountability</p></article>
        <article className="metric-card"><span>Total Cost</span><strong>{dashboard?.totalCost ?? "0.00"}</strong><p>Recorded internal usage cost</p></article>
      </div>
      <div className="readiness-note-grid" style={{ marginBottom: 16 }}>
        <span>STORE_USE is ledger-backed</span>
        <span>Manual consumption supported</span>
        <span>Template execution supported</span>
        <span>Cost centers are environment scoped</span>
      </div>
      {message ? <p className="module-meta">{message}</p> : null}
      {events.length ? (
        <div className="inventory-readonly-table-wrap">
          <table className="inventory-readonly-table">
            <thead><tr><th>Consumption</th><th>Source</th><th>Cost Center</th><th>Location</th><th>Lines</th><th>Total Cost</th><th>Reason</th><th>Created</th></tr></thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{event.consumptionNumber}</td>
                  <td>{event.sourceType}</td>
                  <td>{event.costCenter ?? "—"}</td>
                  <td>{event.location ?? "—"}</td>
                  <td>{event.lineCount}</td>
                  <td>{event.totalCost ?? "—"}</td>
                  <td>{event.reason}</td>
                  <td>{event.createdAt.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="workflow-empty-state-panel phase1f-empty-state-panel">
          <strong>No consumption events yet.</strong>
          <p>Use the Sprint 7 APIs to create cost centers, consumption templates, and internal usage events.</p>
          <span>{dashboard?.ledgerRule ?? "Consumption will reduce stock only through STORE_USE ledger movements."}</span>
        </div>
      )}
    </section>
  );
}
