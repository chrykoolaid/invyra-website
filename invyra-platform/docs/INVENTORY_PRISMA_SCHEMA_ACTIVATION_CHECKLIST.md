# Inventory Prisma Schema Activation Checklist

## Before Editing Live Schema

- [ ] Confirm latest accepted package is Phase 2D or later.
- [ ] Confirm no uncommitted local changes are present.
- [ ] Confirm local `.env` has a valid `DATABASE_URL`.
- [ ] Confirm `npm install` has completed.
- [ ] Confirm `npx prisma generate` works before Inventory schema edits.
- [ ] Confirm existing app can still run or typecheck as far as dependencies allow.

## Schema Review

- [ ] Every Inventory model has `organisationId`.
- [ ] Every operational Inventory model has `environmentName`.
- [ ] Unique constraints include organisation/environment where relevant.
- [ ] Indexes support organisation/environment filtering.
- [ ] No model assumes global stock across tenants.
- [ ] No model mixes LIVE/TRAINING/TEST records.
- [ ] No purchase-order or receiving mutation models are added prematurely.
- [ ] No CRM or POS operational relation is added prematurely.

## Migration Review

- [ ] Migration is named clearly, for example `inventory_foundation`.
- [ ] Migration only creates Inventory foundation tables/enums/indexes.
- [ ] Migration does not alter authentication, organisation, licensing, audit, or environment tables unless explicitly reviewed.
- [ ] Migration is tested on a local database.
- [ ] Prisma Client generation passes.

## After Migration

- [ ] Run `npm run verify:portal-phase2d`.
- [ ] Run `npm run verify:portal-phase2c`.
- [ ] Run `npm run verify:portal-phase2b`.
- [ ] Run `npm run verify:portal-phase1m`.
- [ ] Confirm read-only API still returns safe placeholder/empty responses until data services are scoped.
- [ ] Do not add writes yet.
