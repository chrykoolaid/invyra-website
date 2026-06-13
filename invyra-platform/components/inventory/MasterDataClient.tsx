"use client";

import { useEffect, useMemo, useState } from "react";

type Mode = "items" | "suppliers";
type ApiRecord = Record<string, any>;

type Props = {
  mode: Mode;
  canWrite: boolean;
  canArchive: boolean;
  environment: string;
};

const itemDefaults = { sku: "", barcode: "", name: "", description: "", category: "", brand: "", unitOfMeasure: "each" };
const supplierDefaults = { supplierCode: "", name: "", contactName: "", phone: "", email: "", address: "", notes: "" };

export function MasterDataClient({ mode, canWrite, canArchive, environment }: Props) {
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [form, setForm] = useState<ApiRecord>(mode === "items" ? itemDefaults : supplierDefaults);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const endpoint = mode === "items" ? "/api/inventory/items" : "/api/inventory/suppliers";

  const title = mode === "items" ? "Item Master" : "Supplier Master";
  const description = mode === "items"
    ? "Create, edit, archive and restore inventory item master records. Stock quantities remain protected."
    : "Create, edit, archive and restore supplier master records. Purchase orders remain separate.";

  async function load() {
    const response = await fetch(endpoint, { cache: "no-store" });
    const payload = await response.json();
    setRecords(payload?.data?.records ?? []);
  }

  useEffect(() => { load(); }, [endpoint]);

  const activeRecords = useMemo(() => records.filter((record) => record.status !== "ARCHIVED"), [records]);
  const archivedRecords = useMemo(() => records.filter((record) => record.status === "ARCHIVED"), [records]);

  function updateField(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(mode === "items" ? itemDefaults : supplierDefaults);
  }

  function edit(record: ApiRecord) {
    setEditingId(record.id);
    if (mode === "items") {
      setForm({ sku: record.sku ?? "", barcode: record.barcode ?? "", name: record.name ?? "", description: record.description ?? "", category: record.category ?? "", brand: record.brand ?? "", unitOfMeasure: record.unitOfMeasure ?? "each" });
    } else {
      setForm({ supplierCode: record.supplierCode ?? "", name: record.name ?? "", contactName: record.contactName ?? "", phone: record.phone ?? "", email: record.email ?? "", address: record.address ?? "", notes: record.notes ?? "" });
    }
  }

  async function submit() {
    if (!canWrite) return;
    setMessage("");
    const response = await fetch(editingId ? `${endpoint}/${editingId}` : endpoint, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setMessage(payload?.error?.message ?? "Save failed");
      return;
    }
    setMessage(editingId ? "Record updated. Audit log created." : "Record created. Audit log created.");
    resetForm();
    await load();
  }

  async function archiveAction(record: ApiRecord, restore = false) {
    if (!canArchive) return;
    const response = await fetch(`${endpoint}/${record.id}${restore ? "/restore" : ""}`, { method: restore ? "POST" : "DELETE" });
    const payload = await response.json();
    setMessage(payload?.ok ? (restore ? "Record restored. Audit log created." : "Record archived. Audit log created.") : payload?.error?.message ?? "Action failed");
    await load();
  }

  return (
    <section className="card" style={{ marginTop: 16 }}>
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Sprint 1 Master Data Writes · {environment}</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className={`status-pill ${canWrite ? "state-enabled" : "state-muted"}`}>{canWrite ? "Write Enabled" : "Read Only"}</span>
      </div>

      <div className="readiness-note-grid" style={{ marginBottom: 16 }}>
        <span>No stock mutation</span><span>No ledger movement</span><span>Environment scoped</span><span>Audit logged</span>
      </div>

      {canWrite ? (
        <div className="workflow-layout-grid" style={{ alignItems: "start" }}>
          <div className="workflow-main-zone">
            <h3>{editingId ? "Edit Record" : "Add Record"}</h3>
            <div className="dashboard-grid dashboard-grid-2">
              {mode === "items" ? (
                <>
                  <Field label="SKU *" value={form.sku} onChange={(v) => updateField("sku", v)} />
                  <Field label="Barcode" value={form.barcode} onChange={(v) => updateField("barcode", v)} />
                  <Field label="Name *" value={form.name} onChange={(v) => updateField("name", v)} />
                  <Field label="Unit *" value={form.unitOfMeasure} onChange={(v) => updateField("unitOfMeasure", v)} />
                  <Field label="Category" value={form.category} onChange={(v) => updateField("category", v)} />
                  <Field label="Brand" value={form.brand} onChange={(v) => updateField("brand", v)} />
                  <Field label="Description" value={form.description} onChange={(v) => updateField("description", v)} />
                </>
              ) : (
                <>
                  <Field label="Supplier Code" value={form.supplierCode} onChange={(v) => updateField("supplierCode", v)} />
                  <Field label="Supplier Name *" value={form.name} onChange={(v) => updateField("name", v)} />
                  <Field label="Contact" value={form.contactName} onChange={(v) => updateField("contactName", v)} />
                  <Field label="Phone" value={form.phone} onChange={(v) => updateField("phone", v)} />
                  <Field label="Email" value={form.email} onChange={(v) => updateField("email", v)} />
                  <Field label="Address" value={form.address} onChange={(v) => updateField("address", v)} />
                  <Field label="Notes" value={form.notes} onChange={(v) => updateField("notes", v)} />
                </>
              )}
            </div>
            <div className="empty-state-action-row" style={{ marginTop: 12 }}>
              <button className="secondary-link" type="button" onClick={submit}>{editingId ? "Save Changes" : "Create Record"}</button>
              {editingId ? <button className="secondary-link" type="button" onClick={resetForm}>Cancel Edit</button> : null}
            </div>
          </div>
          <aside className="workflow-side-zone"><strong>Sprint 1 protection</strong><p>These actions only maintain master data. They do not change stock, create movements, receive goods, import CSV files, or process uploads.</p>{message ? <p><strong>{message}</strong></p> : null}</aside>
        </div>
      ) : <div className="workflow-empty-state-panel phase1f-empty-state-panel"><strong>Read-only role</strong><p>Your role can view master data but cannot create or edit records.</p></div>}

      <MasterTable mode={mode} records={activeRecords} canWrite={canWrite} canArchive={canArchive} onEdit={edit} onArchive={(record) => archiveAction(record)} />
      {archivedRecords.length ? <MasterTable mode={mode} records={archivedRecords} canWrite={false} canArchive={canArchive} onEdit={edit} onArchive={(record) => archiveAction(record, true)} archived /> : null}
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label style={{ display: "grid", gap: 6 }}><span>{label}</span><input value={value ?? ""} onChange={(event) => onChange(event.target.value)} style={{ padding: 10, border: "1px solid #d9dde7", borderRadius: 10 }} /></label>;
}

function MasterTable({ mode, records, canWrite, canArchive, onEdit, onArchive, archived = false }: { mode: Mode; records: ApiRecord[]; canWrite: boolean; canArchive: boolean; onEdit: (record: ApiRecord) => void; onArchive: (record: ApiRecord) => void; archived?: boolean }) {
  return (
    <div className="inventory-readonly-table-wrap" style={{ marginTop: 16 }}>
      <h3>{archived ? "Archived Records" : "Active Records"}</h3>
      <table className="inventory-readonly-table">
        <thead><tr>{mode === "items" ? <><th>SKU</th><th>Barcode</th><th>Name</th><th>Category</th><th>Brand</th><th>Unit</th></> : <><th>Code</th><th>Supplier</th><th>Contact</th><th>Phone</th><th>Email</th></>}<th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              {mode === "items" ? <><td>{record.sku}</td><td>{record.barcode ?? "—"}</td><td>{record.name}</td><td>{record.category ?? "—"}</td><td>{record.brand ?? "—"}</td><td>{record.unitOfMeasure}</td></> : <><td>{record.supplierCode}</td><td>{record.name}</td><td>{record.contactName ?? "—"}</td><td>{record.phone ?? "—"}</td><td>{record.email ?? "—"}</td></>}
              <td>{record.status}</td>
              <td>
                <div className="empty-state-action-row">
                  {canWrite && !archived ? <button className="secondary-link" type="button" onClick={() => onEdit(record)}>Edit</button> : null}
                  {canArchive ? <button className="secondary-link" type="button" onClick={() => onArchive(record)}>{archived ? "Restore" : "Archive"}</button> : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
