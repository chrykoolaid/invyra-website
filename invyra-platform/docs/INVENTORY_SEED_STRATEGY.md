# Inventory Seed Strategy — Phase 2B

## Status

CONTRACTED / NOT APPLIED

Phase 2B does not change `prisma/seed.ts`.

## Future Seed Principle

Seed data must support safe local development and QA without implying production readiness.

## Recommended Phase 2C Seed Scope

Allowed in Phase 2C:

```text
Inventory configuration defaults
Empty Inventory readiness state
Optional sample location records for TRAINING only
Optional sample item records for TRAINING only
```

Not allowed in Phase 2C:

```text
LIVE stock balances with fake quantities
Fake purchase orders
Fake receiving confirmations
Fake wastage records
Fake store-use records
Fake stocktake sessions
Fake imports marked as committed
Fake CRM or POS operational access
```

## Environment Seed Rules

```text
LIVE should start empty unless explicitly configured by the owner/admin.
TRAINING may contain clearly labelled practice data.
TEST may contain validation fixtures.
```

## Opening Balance Rule

Opening stock must not be inserted as silent stock balance rows in future production workflows.

Opening stock should be created through:

```text
InventoryImportBatch
InventoryImportRow
InventoryMovement movementType = OPENING_BALANCE
InventoryStockBalance projection update
AuditLog action = INVENTORY_OPENING_BALANCE_POSTED
```

This is deferred until the import commit/opening balance governance phase.
