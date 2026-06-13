# Invyra Inventory Implementation Program — Sprint 2 Report

## Status

IMPLEMENTED AS SECOND CONSTRUCTION PACKAGE.

## Baseline

`invyra_inventory_sprint1_item_supplier_master_v1.zip`

## Sprint Objective

Introduce the Inventory Ledger Foundation so stock quantities begin through governed ledger movements rather than direct quantity edits.

## Implemented

### Ledger Service

Added:

- `lib/inventory/inventory-ledger-service.ts`

Capabilities:

- Opening Balance posting
- Manual Adjustment posting
- Stock balance calculation
- Default location creation for first stock setup
- Negative stock prevention
- Duplicate opening balance prevention
- Immutable movement rows
- Stock balance upsert from ledger movement

### API Routes

Added:

- `GET /api/inventory/stock-balances`
- `POST /api/inventory/opening-balances`
- `POST /api/inventory/adjustments`

### Portal UI

Added:

- `/portal/inventory/ledger`

The Ledger UI supports:

- Opening balance entry
- Manual adjustment entry
- Current stock balance table
- Movement ledger table
- Role-gated transaction controls
- Read-only view for restricted roles

### Database Migration

Added:

`prisma/migrations/20260613100000_inventory_sprint2_ledger_foundation/migration.sql`

This adds:

- `InventoryMovement.quantityBefore`
- Movement type/date index

### Audit Events

Added audit coverage for:

- `OPENING_BALANCE_CREATED`
- `STOCK_ADJUSTMENT_CREATED`

### Governance Rules

Implemented:

- Manager, Administrator and Owner can post ledger transactions.
- Staff and Supervisor remain read-only for ledger posting.
- Opening balance is allowed once per item/location/environment.
- Adjustments require a reason.
- Negative stock is blocked.
- Ledger records are append-only.
- LIVE/TRAINING/TEST scoping remains enforced.

## Explicitly Not Enabled

- No purchase orders.
- No receiving.
- No transfers.
- No wastage.
- No store use.
- No stocktake reconciliation.
- No CSV import processing.
- No upload processing.

## Lock Decision

Sprint 2 is ready for local runtime verification.
