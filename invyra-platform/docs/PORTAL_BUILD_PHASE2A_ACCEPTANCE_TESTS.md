# 🔒 PHASE 2A ACCEPTANCE TESTS — INVENTORY BACKEND INTEGRATION READINESS AUDIT

## Purpose

Validate that Phase 2A audits backend readiness without accidentally adding operational Inventory backend behaviour.

---

## Acceptance Criteria

### 1. Phase 2A audit documents exist

Required files:

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

Expected result:

```text
PASS
```

---

### 2. Package exposes Phase 2A verifier

Required script:

```text
npm run verify:portal-phase2a
```

Expected result:

```text
PASS
```

---

### 3. Audit correctly identifies platform foundation as available

The audit must confirm the presence of:

```text
Authentication/session context
Organisation scoping
Role permissions
Licence entitlement checking
Environment access checking
Audit logging
API guard pattern
```

Expected result:

```text
PASS
```

---

### 4. Audit correctly identifies Inventory backend gaps

The audit must not pretend the Inventory backend exists.

It must identify missing Inventory-specific domains such as:

```text
Item master
Inventory movements
Suppliers
Purchase orders
Receiving
Wastage
Store use
Reorder review
Gap scan
Stocktake
Reports
Imports
Configuration persistence
```

Expected result:

```text
PASS
```

---

### 5. No Inventory API routes are added in Phase 2A

Phase 2A is an audit phase. It must not add live Inventory API routes.

Forbidden additions:

```text
app/api/inventory/items/route.ts
app/api/inventory/movements/route.ts
app/api/inventory/suppliers/route.ts
app/api/inventory/orders/route.ts
app/api/inventory/receiving/route.ts
app/api/inventory/imports/route.ts
```

Expected result:

```text
PASS
```

---

### 6. No Inventory Prisma operational models are added in Phase 2A

Phase 2A must not add schema models yet.

Forbidden Phase 2A models include:

```text
InventoryItem
InventoryMovement
InventorySupplier
InventoryPurchaseOrder
InventoryReceivingSession
InventoryWastageEvent
InventoryStocktakeSession
InventoryImportBatch
InventoryConfiguration
```

Expected result:

```text
PASS
```

---

### 7. Existing Phase 1 lock remains valid

Phase 2A must preserve Phase 1M:

```text
Inventory remains Available First
CRM/POS remain Future Module / Coming Later
Roadmap modules remain roadmap-only
No uploads
No CSV parsing
No Prisma writes
No stock mutation
No purchase order submission
No receiving confirmation
```

Expected result:

```text
PASS
```

---

## Verification Command

Run:

```bash
cd invyra-platform
npm run verify:portal-phase2a
npm run verify:portal-phase1m
npm run verify:portal-phase1l
npm run verify:portal-phase1k
npm run verify:portal-phase1j
npm run verify:portal-phase1i
npm run verify:portal-phase1h
npm run verify:portal-phase1g
npm run verify:portal-phase1f
npm run verify:portal-phase1e
npm run verify:portal-phase1d
```

Expected result:

```text
All checks pass.
```
