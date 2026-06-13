# Inventory Backend Integration Readiness Audit — Phase 2A

## Audit Result

```text
Backend foundation: PARTIALLY READY
Inventory operational backend: NOT STARTED
Portal read-only wiring readiness: READY AFTER schema/API contract
Write-action readiness: NOT READY
Import readiness: PREPARATION ONLY
```

---

## Current Backend Assets That Can Be Reused

| Foundation | Current Status | Reuse Decision |
|---|---:|---|
| Authentication/session | Present | Reuse |
| Organisation context | Present | Reuse |
| Role/membership model | Present | Reuse |
| Permission levels | Present | Reuse |
| Licence module entitlement | Present | Reuse |
| Environment access | Present | Reuse |
| Device foundation | Present | Reuse later |
| Audit log table | Present | Reuse with Inventory action taxonomy |
| API guard helper | Present | Reuse for Inventory API routes |
| Portal route shells | Present | Reuse for read-only wiring |

---

## Current Inventory Backend Status

| Domain | Status | Notes |
|---|---:|---|
| Item master | Missing | Needs tenant + environment scoped model |
| Stock balances | Missing | Must never mix LIVE/TRAINING/TEST |
| Inventory movements | Missing | Needed before any stock mutation |
| Suppliers | Missing | Safe early read/write candidate after schema |
| Supplier item mapping | Missing | Needed for reorder/order logic |
| Purchase orders | Missing | Must come after item/supplier foundations |
| Receiving | Missing | Must create movement records only after PO schema exists |
| Discrepancies | Missing | Needs receiving dependency |
| Wastage | Missing | Must be audit-heavy and approval-aware |
| Store use | Missing | Must create movements and cost context |
| Reorder review | Missing | Needs thresholds, stock, demand history |
| Gap scan | Missing | Needs stock + rules + findings model |
| Stocktake | Missing | Needs session, lines, variance approvals |
| Reports | Missing | Needs stable read models first |
| Imports | Preparation only | Upload/parser/commit must remain deferred |
| Admin configuration | Shell only | Needs persisted setting model and audit writes |

---

## Non-Negotiable Backend Rules

1. Every Inventory operational row must be scoped to an organisation.
2. Every Inventory operational row must be scoped to an environment or a clearly equivalent environment partition.
3. LIVE, TRAINING, and TEST must never share stock balances or movement ledgers.
4. Opening balances must be represented as auditable movements.
5. Any stock change must be traceable to a source workflow and user/session context.
6. API routes must use the existing platform guard pattern.
7. Role permissions must map to VIEW, CREATE, EDIT, APPROVE, and ADMINISTER.
8. Writes must produce audit logs.
9. Imports must start with preview-only behaviour.
10. Reports must never combine environments unless explicitly designed and labelled.

---

## Safe First Backend Integration Candidates

### Candidate 1 — Read-only Inventory readiness API

```text
GET /api/inventory/readiness
```

Purpose:

```text
Return organisation/environment/licence/setup state without operational inventory rows.
```

Risk:

```text
Low
```

### Candidate 2 — Read-only Inventory configuration snapshot

```text
GET /api/inventory/configuration
```

Purpose:

```text
Return defaults and disabled/pending settings state.
```

Risk:

```text
Low
```

### Candidate 3 — Read-only Items API

```text
GET /api/inventory/items
```

Purpose:

```text
List item master records after InventoryItem model exists.
```

Risk:

```text
Medium
```

### Candidate 4 — Read-only Suppliers API

```text
GET /api/inventory/suppliers
```

Purpose:

```text
List supplier records after InventorySupplier model exists.
```

Risk:

```text
Medium
```

### Candidate 5 — Read-only Movements API

```text
GET /api/inventory/movements
```

Purpose:

```text
List movement ledger rows after InventoryMovement model exists.
```

Risk:

```text
Medium to High because it exposes operational truth.
```

---

## High-Risk Areas To Defer

Do not implement these until read-only APIs and runtime tests are stable:

```text
POST /api/inventory/items
POST /api/inventory/opening-balances
POST /api/inventory/orders
POST /api/inventory/receiving
POST /api/inventory/wastage
POST /api/inventory/store-use
POST /api/inventory/stocktake
POST /api/inventory/imports/commit
```

---

## Phase 2A Recommendation

Proceed to Phase 2B before touching backend routes.

Phase 2B should produce:

```text
Inventory data model contract
Environment separation design
Tenant scoping rules
Audit taxonomy
Permission-action matrix
Migration notes
Seed strategy
Read-only endpoint contract
```
