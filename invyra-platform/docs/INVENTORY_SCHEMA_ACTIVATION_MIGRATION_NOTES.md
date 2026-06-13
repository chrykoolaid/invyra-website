# Inventory Schema Activation Migration Notes — Phase 2E

## Migration Folder

`prisma/migrations/20260612020000_inventory_schema_activation/migration.sql`

## Intended Database

PostgreSQL.

## Production Warning

Do not apply this migration to a production database without:

1. Backup confirmation.
2. Migration dry run in TEST.
3. Rollback plan confirmation.
4. Maintenance window approval.
5. Post-migration Prisma generate and application smoke test.

## Rollback Principle

Because the migration creates new Inventory-only tables, rollback can safely drop these new Inventory tables and enums if no operational data has been committed.

Once real customer Inventory data is inserted, rollback must become data-preserving and cannot simply drop tables.
