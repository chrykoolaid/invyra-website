# Inventory Backend Phase 2 Roadmap — Recommended After Phase 2A

## Phase 2B — Inventory Data Model Contract

Deliverables:

```text
Prisma schema design for first Inventory model slice
Tenant scoping rules
Environment separation rules
Permission-action matrix
Audit action taxonomy
Migration notes
Seed strategy
Read-only API contract
```

Do not implement UI mutations yet.

---

## Phase 2C — Read-only Inventory API Foundation

Deliverables:

```text
GET /api/inventory/readiness
GET /api/inventory/items
GET /api/inventory/suppliers
GET /api/inventory/movements
GET /api/inventory/configuration
API smoke tests
Guard verification
Empty data response shape
```

Allowed behaviour:

```text
Read-only responses
Empty states
Environment-scoped results
No mutations
```

---

## Phase 2D — Read-only Portal Data Wiring

Deliverables:

```text
Inventory dashboard reads readiness API
Items page reads item list API
Suppliers page reads supplier list API
Movements page reads ledger API
Configuration page reads configuration snapshot
```

Allowed behaviour:

```text
Display real empty state if no data exists
Display real records only if API returns records
No create/edit/delete actions
```

---

## Phase 2E — Controlled Setup Writes

Deliverables:

```text
Create supplier
Create item draft
Save basic reorder level
Save admin configuration setting
Audit logging
Permission checks
Validation
Runtime smoke tests
```

Boundary:

```text
No purchase order submission
No receiving confirmation
No import commit
No automatic stock mutation except explicitly scoped opening-balance governance
```

---

## Phase 2F — Import Preview

Deliverables:

```text
Upload UI
CSV parser
Preview rows
Validation result
Reject invalid rows
No commit
No stock mutation
```

---

## Phase 2G — Import Commit and Opening Balance Governance

Deliverables:

```text
Commit approved import batch
Create auditable opening balance movements
Rollback evidence
LIVE confirmation step
TRAINING/TEST separation proof
```

---

## Phase 2H — Operational Workflow Writes

Only after previous phases pass:

```text
Purchase order draft/submit/approve/reject
Receiving confirmation
Wastage posting
Store-use posting
Stocktake posting
Gap scan run persistence
Reorder review recommendations
```
