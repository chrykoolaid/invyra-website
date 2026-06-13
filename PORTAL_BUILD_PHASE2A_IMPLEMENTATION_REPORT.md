# 🔒 INVYRA WEBSITE / PORTAL BUILD DEVELOPMENT PROGRAM — PHASE 2A IMPLEMENTATION REPORT

## Phase

Phase 2A — Inventory Backend Integration Readiness Audit

## Baseline Used

`invyra_website_portal_phase1m_inventory_first_portal_phase1_lock_v1.zip`

## Output Package

`invyra_website_portal_phase2a_backend_integration_readiness_audit_v1.zip`

## Status

COMPLETE / AUDIT-READY

This phase does not connect the Inventory backend. It audits the current protected portal, platform foundation, schema, API layer, permissions, environment rules, import preparation, admin configuration shell, and workflow route structure so the next implementation phase can begin safely.

---

## Executive Verdict

The portal is ready for backend planning, but it is not ready for live Inventory backend connection yet.

The correct next implementation path is:

```text
Schema and contract first
↓
Read-only Inventory backend services
↓
Read-only portal data wiring
↓
Controlled write actions
↓
Import preview
↓
Import commit
↓
Operational workflow actions
```

Do not jump directly into uploads, purchase orders, receiving, stock mutation, or reports until the Inventory data model and environment separation contract are implemented.

---

## What Was Audited

### Protected Portal Layer

Audited routes:

```text
/portal
/portal/inventory
/portal/inventory/[workflow]
/portal/inventory/readiness
/portal/inventory/setup
/portal/inventory/imports
/portal/inventory/configuration
/portal/licensing
/portal/devices
/portal/crm
/portal/pos
/portal/roadmap/[module]
```

### Backend Foundation Layer

Audited foundations:

```text
Authentication
Session context
Organisation context
Membership roles
Permission levels
Licence modules
Environment access
Device foundation
Audit logging
API guard pattern
Prisma schema
Seed file
Existing API routes
```

### Inventory-Specific Backend Layer

Audited expected but missing backend domains:

```text
Item master
Inventory movements
Supplier records
Supplier item mapping
Purchase orders
Receiving
Discrepancies
Wastage
Store use
Reorder thresholds
Gap scan outputs
Stocktake sessions
Report snapshots
Import batches
Admin inventory settings
```

---

## Key Findings

### Finding 1 — Platform foundation exists

The project already has the foundations needed to protect Inventory backend routes later:

```text
Session lookup
Organisation scoping
Role membership
Permission checking
Licence entitlement checking
Environment access checking
Audit logging
API guard helper
```

This is good. We do not need to rebuild the platform foundation before Inventory backend work starts.

### Finding 2 — Inventory-specific schema does not exist yet

The current Prisma schema contains platform models, but does not yet contain Inventory operational models.

Missing first-class Inventory models include:

```text
InventoryItem
InventoryLocation
InventoryStockBalance
InventoryMovement
InventorySupplier
InventorySupplierItem
InventoryPurchaseOrder
InventoryPurchaseOrderLine
InventoryReceivingSession
InventoryReceivingLine
InventoryDiscrepancy
InventoryWastageEvent
InventoryStoreUseEvent
InventoryReorderRule
InventoryGapScanRun
InventoryGapScanFinding
InventoryStocktakeSession
InventoryStocktakeLine
InventoryImportBatch
InventoryImportRow
InventoryConfiguration
```

This means the portal must remain shell/readiness-only until Phase 2B introduces the data contract.

### Finding 3 — Inventory-specific API routes do not exist yet

Existing API routes are platform-focused:

```text
/api/audit
/api/devices
/api/environments
/api/licensing
/api/users
```

There are no Inventory API routes yet, such as:

```text
/api/inventory/items
/api/inventory/movements
/api/inventory/suppliers
/api/inventory/orders
/api/inventory/receiving
/api/inventory/reorder-review
/api/inventory/gap-scan
/api/inventory/stocktake
/api/inventory/imports
/api/inventory/configuration
```

This is acceptable for Phase 1, but Phase 2 must introduce Inventory APIs in a controlled order.

### Finding 4 — Route protection pattern is ready to reuse

The existing API guard pattern is suitable for Inventory routes:

```text
requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" })
requirePlatformAccess({ request, module: "INVENTORY", level: "CREATE" })
requirePlatformAccess({ request, module: "INVENTORY", level: "EDIT" })
requirePlatformAccess({ request, module: "INVENTORY", level: "APPROVE" })
requirePlatformAccess({ request, module: "INVENTORY", level: "ADMINISTER" })
```

This should be reused rather than replaced.

### Finding 5 — Environment separation needs to be designed into every Inventory table

LIVE, TRAINING, and TEST already exist at the platform session/access level.

However, Inventory operational data models do not exist yet. When they are added, every operational Inventory table must include an environment field or an equivalent environment partitioning rule.

Non-negotiable requirement:

```text
LIVE stock, TRAINING stock, and TEST stock must never share balances, movements, orders, receiving events, reports, or imports.
```

### Finding 6 — Audit logging foundation exists, but Inventory action taxonomy is missing

The generic `AuditLog` model exists and can record module/environment/action metadata.

Missing Inventory action taxonomy examples:

```text
INVENTORY_ITEM_CREATED
INVENTORY_ITEM_UPDATED
INVENTORY_OPENING_BALANCE_POSTED
INVENTORY_MOVEMENT_CREATED
INVENTORY_SUPPLIER_CREATED
INVENTORY_PO_DRAFT_CREATED
INVENTORY_PO_SUBMITTED
INVENTORY_PO_APPROVED
INVENTORY_RECEIVING_CONFIRMED
INVENTORY_DISCREPANCY_REPORTED
INVENTORY_WASTAGE_SUBMITTED
INVENTORY_STORE_USE_SUBMITTED
INVENTORY_STOCKTAKE_STARTED
INVENTORY_STOCKTAKE_VARIANCE_APPROVED
INVENTORY_IMPORT_PREVIEWED
INVENTORY_IMPORT_COMMITTED
INVENTORY_CONFIG_UPDATED
```

### Finding 7 — Portal workflow route skeletons are ready for read-only wiring

The Phase 1 portal routes are now useful because each route has a clear future backend destination.

Best first backend wiring candidates:

```text
Items — read-only list
Suppliers — read-only list
Movements — read-only ledger
Readiness — backend setup checklist summary
Configuration — read-only settings snapshot
```

Do not begin with purchase order mutation, receiving confirmation, wastage submission, stocktake posting, or import commit.

---

## Phase 2A Deliverables Added

### Reports and planning files

```text
PORTAL_BUILD_PHASE2A_IMPLEMENTATION_REPORT.md
PORTAL_BUILD_PHASE2A_ACCEPTANCE_TESTS.md
invyra-platform/docs/PORTAL_BUILD_PHASE2A_IMPLEMENTATION_REPORT.md
invyra-platform/docs/PORTAL_BUILD_PHASE2A_ACCEPTANCE_TESTS.md
invyra-platform/docs/INVENTORY_BACKEND_INTEGRATION_READINESS_AUDIT.md
invyra-platform/docs/INVENTORY_BACKEND_CONTRACT_MATRIX.md
invyra-platform/docs/INVENTORY_BACKEND_MODEL_GAP_REGISTER.md
invyra-platform/docs/INVENTORY_BACKEND_PHASE2_ROADMAP.md
invyra-platform/docs/PORTAL_PHASE2A_BACKEND_READINESS_MANIFEST.json
```

### Verification

```text
invyra-platform/scripts/verify-portal-phase2a.mjs
npm run verify:portal-phase2a
```

### Manifest updates

```text
invyra-platform/docs/ROUTE_PROTECTION_MANIFEST.md
```

---

## Recommended Phase 2 Implementation Roadmap

### Phase 2B — Inventory Data Model Contract

Create the first Inventory schema contract before route wiring.

Required output:

```text
Prisma model plan
Environment separation rules
Tenant scoping rules
Indexes
Relations
Audit action taxonomy
Migration risk notes
Seed strategy
```

### Phase 2C — Read-only Inventory API Foundation

Build read-only guarded endpoints first.

Suggested endpoints:

```text
GET /api/inventory/readiness
GET /api/inventory/items
GET /api/inventory/suppliers
GET /api/inventory/movements
GET /api/inventory/configuration
```

### Phase 2D — Read-only Portal Data Wiring

Wire the portal to safe read-only APIs.

Suggested first pages:

```text
/portal/inventory
/portal/inventory/items
/portal/inventory/suppliers
/portal/inventory/movements
/portal/inventory/configuration
```

### Phase 2E — Controlled Setup Writes

Only after read-only APIs pass runtime tests, introduce limited write actions:

```text
Create supplier
Create item draft
Save reorder level
Save configuration setting
```

### Phase 2F — Import Preview Only

Introduce file upload and parsing only as preview.

Rules:

```text
No stock mutation
No direct item creation without review
No supplier creation without preview approval
No import commit until audit and rollback are scoped
```

### Phase 2G — Import Commit + Opening Balance Governance

Introduce controlled commits only after preview is locked.

Rules:

```text
Opening balances must create auditable movements
Import batches must have rollback evidence
LIVE imports require explicit confirmation
TRAINING imports must never affect LIVE
```

---

## Do Not Build Yet

Phase 2A confirms that the following should still be deferred:

```text
Purchase order submit/approve/reject mutation
Receiving confirmation mutation
Stocktake posting
Wastage stock reduction
Store-use stock reduction
Automated reorder generation
Gap scan calculations
CSV import commit
Report generation/export
Supplier portal integration
CRM portal launch
POS portal launch
```

---

## Final Phase 2A Decision

```text
Phase 2A is complete.
Backend integration should proceed only after Phase 2B creates the Inventory data model contract.
```

Recommended next scope:

```text
Phase 2B — Inventory Data Model Contract
```
