# Inventory Prisma Schema Activation Plan — Phase 2D

## Purpose

This document defines how Inventory Prisma models should be activated safely after the Phase 2B contract and Phase 2C read-only API foundation.

## Activation Principle

Inventory schema activation must be explicit, reviewed, reversible, and tenant/environment safe.

The live schema must not be edited casually. Activation must happen as a controlled migration phase.

## Activation Sequence

1. Confirm Phase 1 portal lock is still passing.
2. Confirm Phase 2A readiness audit is still passing.
3. Confirm Phase 2B data model contract is still passing.
4. Confirm Phase 2C read-only API foundation is still passing.
5. Compare `INVENTORY_PRISMA_SCHEMA_DRAFT.prisma` against `INVENTORY_PRISMA_SCHEMA_ACTIVATION_CANDIDATE.prisma`.
6. Review tenant isolation fields on every model.
7. Review environment separation fields on every model.
8. Review unique constraints for organisation/environment scope.
9. Review indexes for expected read-only portal queries.
10. Paste the approved candidate into `prisma/schema.prisma` only during Phase 2E.
11. Run `npx prisma format`.
12. Run `npx prisma migrate dev --name inventory_foundation`.
13. Run `npx prisma generate`.
14. Run typecheck and existing portal verification scripts.
15. Run a database inspection check to confirm tables and indexes exist.
16. Do not enable writes until Phase 2F or later.

## Required Models For First Activation

Minimum safe first activation:

- InventoryLocation
- InventoryItem
- InventoryStockBalance
- InventoryMovement
- InventorySupplier
- InventorySupplierItem
- InventoryConfiguration
- InventoryImportBatch
- InventoryImportRow

## Models Deferred From First Activation

The following should remain out of the first schema migration unless specifically scoped:

- Purchase Order models
- Receiving header/line models
- Wastage approval workflow models
- Store use approval workflow models
- Stocktake session/count/variance models
- Forecasting models
- AI suggestion models
- POS integration models
- CRM integration models

## Activation Gate

Phase 2E may proceed only when:

```text
Phase 2D verifier passes
Local dependencies are installed
Prisma client can generate
A local database URL is configured
Rollback procedure is accepted
```
