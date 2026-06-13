# Inventory Data Model Contract — Phase 2B

## Status

CONTRACTED / NOT MIGRATED

This document defines the Inventory backend data model contract for the protected Invyra portal.

It does **not** add live Prisma models, database migrations, uploads, CSV parsing, API routes, item creation, supplier creation, stock mutation, purchase order submission, receiving confirmation, or report generation.

---

## Purpose

Phase 2B converts the Phase 2A backend readiness audit into an implementation contract.

The contract answers:

```text
Which Inventory data families are needed?
How must they be tenant-scoped?
How must LIVE / TRAINING / TEST be separated?
Which permission level controls each operation?
Which audit events must exist?
Which read-only APIs can be implemented first?
Which write actions remain deferred?
```

---

## Non-negotiable Scoping Rule

Every Inventory operational record must be scoped by:

```text
organisationId
environmentName
```

Where appropriate, records must also include:

```text
locationId
createdByUserId
updatedByUserId
deviceId
sourceReference
```

The portal must never read LIVE stock when the session environment is TRAINING or TEST.

---

## Environment Separation Contract

```text
LIVE = real operational inventory
TRAINING = staff practice inventory
TEST = controlled validation inventory
```

The following data must never be shared across environments:

```text
Stock balances
Movement ledger entries
Opening balances
Suppliers where environment-specific setup is enabled
Supplier item mappings
Purchase orders
Receiving sessions
Discrepancies
Wastage events
Store-use events
Reorder rules
Gap scan runs
Stocktake sessions
Import batches
Reports
Configuration snapshots
```

---

## First Model Slice

The first contracted Inventory model slice is:

```text
InventoryLocation
InventoryItem
InventoryStockBalance
InventoryMovement
InventorySupplier
InventorySupplierItem
InventoryConfiguration
InventoryImportBatch
InventoryImportRow
```

These support future read-only API implementation first, then controlled setup writes later.

---

## Deferred Operational Model Slice

The following models are contract-drafted but should not become active write workflows until later phases:

```text
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
```

---

## Model Family Contract

| Family | Primary Models | First Allowed Phase | Boundary |
|---|---|---:|---|
| Location | InventoryLocation | 2C | Read-only API first |
| Item Master | InventoryItem | 2C | Read-only API first |
| Stock Balance | InventoryStockBalance | 2C | Read-only API first |
| Movement Ledger | InventoryMovement | 2C | Read-only API first |
| Supplier | InventorySupplier | 2C | Read-only API first |
| Supplier Mapping | InventorySupplierItem | 2C | Read-only API first |
| Configuration | InventoryConfiguration | 2C | Read-only API first |
| Import Batch | InventoryImportBatch, InventoryImportRow | 2F | Preview before commit |
| Purchase Orders | InventoryPurchaseOrder, InventoryPurchaseOrderLine | 2H | Operational write phase |
| Receiving | InventoryReceivingSession, InventoryReceivingLine | 2H | Operational write phase |
| Wastage | InventoryWastageEvent | 2H | Operational write phase |
| Store Use | InventoryStoreUseEvent | 2H | Operational write phase |
| Reorder Review | InventoryReorderRule | 2H | Operational write phase |
| Gap Scan | InventoryGapScanRun, InventoryGapScanFinding | 2H | Operational write phase |
| Stocktake | InventoryStocktakeSession, InventoryStocktakeLine | 2H | Operational write phase |

---

## Inventory Stock Truth Rule

`InventoryStockBalance` is not the source of historical truth.

Historical truth must come from:

```text
InventoryMovement
```

`InventoryStockBalance` is a current-state projection that must only be changed by governed movement posting.

Opening stock must be represented by an auditable movement type, not by silently editing stock totals.

---

## First Read-only APIs Allowed After This Contract

Phase 2C may introduce these read-only endpoints:

```text
GET /api/inventory/readiness
GET /api/inventory/items
GET /api/inventory/suppliers
GET /api/inventory/movements
GET /api/inventory/configuration
```

They must return empty arrays or null configuration safely when no records exist.

---

## Explicitly Deferred

```text
POST /api/inventory/items
POST /api/inventory/suppliers
POST /api/inventory/imports
POST /api/inventory/opening-balances
POST /api/inventory/orders
POST /api/inventory/receiving
POST /api/inventory/wastage
POST /api/inventory/store-use
POST /api/inventory/stocktake
```

These are not part of Phase 2B.
