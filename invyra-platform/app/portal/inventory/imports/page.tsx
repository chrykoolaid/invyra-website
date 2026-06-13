import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/security/access-control";
import {
  getInventoryImportStatusClass,
  getInventoryImportStatusLabel,
  getInventorySetupActionClass,
  getInventorySetupActionLabel,
  inventoryImportStages,
  inventoryImportTemplates
} from "@/lib/portal/inventory-setup-actions";
import { PortalShell } from "@/components/PortalShell";

function getEnvironmentCopy(environment: string) {
  if (environment === "TRAINING") return "Training import preparation · practice data must never affect LIVE stock";
  if (environment === "TEST") return "Test import preparation · validation data stays controlled";
  return "LIVE import preparation · no upload or stock mutation is active yet";
}

export default async function InventoryImportPreparationPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "INVENTORY", level: "VIEW" });
  if (!allowed) redirect("/access-denied");

  return (
    <PortalShell session={session}>
      <section className={`environment-banner environment-${session.environment.toLowerCase()}`}>
        <strong>{session.environment}</strong>
        <span>{getEnvironmentCopy(session.environment)}</span>
      </section>

      <section className="hero-card inventory-hero-card import-hero-card">
        <div>
          <p className="eyebrow">Inventory Data Import Preparation</p>
          <h1>Prepare import templates before backend upload</h1>
          <p>
            This page defines the item, supplier, opening balance, reorder, and supplier mapping preparation rules. It does not upload files, parse data, write records, or mutate stock.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="secondary-link" href="/portal/inventory/setup">Setup Actions</Link>
          <Link className="secondary-link" href="/portal/inventory/readiness">Readiness Flow</Link>
          <Link className="primary-link" href="/portal/inventory">Inventory Dashboard</Link>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-4">
        <article className="metric-card metric-card-primary">
          <span>Templates</span>
          <strong>{inventoryImportTemplates.length}</strong>
          <p>Preparation templates documented</p>
        </article>
        <article className="metric-card">
          <span>Upload Status</span>
          <strong>Disabled</strong>
          <p>No file upload in Phase 1G</p>
        </article>
        <article className="metric-card">
          <span>Parser Status</span>
          <strong>Deferred</strong>
          <p>No validation engine active yet</p>
        </article>
        <article className="metric-card">
          <span>Stock Mutation</span>
          <strong>Blocked</strong>
          <p>No LIVE stock changes can occur here</p>
        </article>
      </section>

      <section className="import-disabled-panel">
        <div>
          <p className="eyebrow">Upload Boundary</p>
          <h2>File uploads are intentionally disabled</h2>
          <p>
            Phase 1G prepares the import contract only. Backend upload, CSV parsing, duplicate detection, preview approval, database writes, and audit commit are separate future implementation tasks.
          </p>
        </div>
        <div className="readiness-list readiness-list-left">
          <span>Uploads remain disabled</span>
          <span>No database writes</span>
          <span>Backend Deferred</span>
        </div>
      </section>

      <section className="import-stage-board">
        <div className="workflow-layout-header">
          <div>
            <p className="eyebrow">Import Lifecycle Preparation</p>
            <h2>Future import stages</h2>
            <p>Only the first stage is prepared in the portal. All backend stages remain labelled and blocked.</p>
          </div>
        </div>
        <div className="dashboard-grid dashboard-grid-4 compact-module-grid">
          {inventoryImportStages.map((stage) => (
            <article className="module-card import-stage-card" key={stage.id}>
              <div className="module-card-header">
                <h3>{stage.title}</h3>
                <span className={`status-pill ${getInventorySetupActionClass(stage.state)}`}>
                  {getInventorySetupActionLabel(stage.state)}
                </span>
              </div>
              <p>{stage.description}</p>
              <div className="readiness-list readiness-list-left readiness-stack">
                {stage.notes.map((note) => <span key={note}>{note}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-heading">
        <div>
          <h2>Import Template Preparation</h2>
          <p>These template cards define expected fields and safety rules before backend import work begins.</p>
        </div>
      </section>

      <section className="import-template-list">
        {inventoryImportTemplates.map((template) => (
          <article className="card import-template-card" key={template.id}>
            <div className="module-card-header">
              <div>
                <h3>{template.title}</h3>
                <p>{template.description}</p>
              </div>
              <span className={`status-pill ${getInventoryImportStatusClass(template.status)}`}>
                {getInventoryImportStatusLabel(template.status)}
              </span>
            </div>

            <div className="import-template-meta">
              <span><strong>File type:</strong> {template.fileType}</span>
              <span><strong>Linked workflow:</strong> <Link href={template.route}>{template.route}</Link></span>
              <span><strong>Boundary:</strong> {template.backendBoundary}</span>
            </div>

            <div className="dashboard-grid dashboard-grid-2 import-template-columns">
              <div>
                <h4>Required Columns</h4>
                <div className="setup-dependency-row">
                  {template.requiredColumns.map((column) => <span key={column}>{column}</span>)}
                </div>
              </div>
              <div>
                <h4>Optional Columns</h4>
                <div className="setup-dependency-row">
                  {template.optionalColumns.map((column) => <span key={column}>{column}</span>)}
                </div>
              </div>
            </div>

            <div className="dashboard-grid dashboard-grid-2 import-template-columns">
              <div>
                <h4>Validation Rules</h4>
                <div className="readiness-list readiness-list-left readiness-stack">
                  {template.validationRules.map((rule) => <span key={rule}>{rule}</span>)}
                </div>
              </div>
              <div>
                <h4>Safety Rules</h4>
                <div className="readiness-list readiness-list-left readiness-stack">
                  {template.safetyRules.map((rule) => <span key={rule}>{rule}</span>)}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="card readiness-card">
        <div>
          <h2>Import preparation accepted boundary</h2>
          <p>
            This page is intentionally preparation-only. It should help customers clean their source spreadsheets without implying that live import tooling exists yet.
          </p>
        </div>
        <div className="readiness-list">
          <span>No upload</span>
          <span>No parser</span>
          <span>No database writes</span>
          <span>No live stock mutation</span>
        </div>
      </section>
    </PortalShell>
  );
}
