# Inventory Prisma Migration Safety Rules

## Non-negotiable Rules

1. LIVE, TRAINING, and TEST data must remain separated.
2. Every Inventory query must scope by organisation.
3. Every Inventory operational query must scope by environment.
4. Schema activation must not create live operational data.
5. Schema activation must not enable stock mutation.
6. Schema activation must not enable imports/uploads.
7. Schema activation must not enable CRM/POS as operational modules.
8. Migration must be reversible during development.

## Prohibited In First Migration

- No fake seeded stock quantities
- Seeded fake supplier catalogues
- Auto-created purchase orders
- Receiving confirmations
- Stock adjustments
- CSV import commits
- AI forecasting tables
- POS sales sync tables
- CRM customer sync tables

## Required Index Pattern

Inventory tables should prefer indexes that start with:

```text
organisationId + environmentName
```

This supports tenant/environment filtering and reduces accidental cross-environment leakage.

## Migration Validation

The first migration should be checked for:

- created tables only
- expected indexes
- expected unique constraints
- no destructive table alterations
- no hidden writes
