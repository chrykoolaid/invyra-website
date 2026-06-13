# Inventory Read-only Runtime QA Guide — Phase 2H

Status: QA / local verification only.

## Purpose

Phase 2H validates that the Phase 2F/2G read-only Inventory service and portal binding can be checked locally without enabling writes.

This guide covers:

- protected Inventory portal pages
- read-only Inventory API endpoints
- empty-state behaviour when no Inventory rows are seeded
- local seed expectations
- boundaries that must remain disabled

## Required local command order

```bash
cd invyra-platform
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

Then in a second terminal:

```bash
cd invyra-platform
npm run smoke:portal
npm run smoke:inventory-readonly-api
npm run review:inventory-seed
npm run verify:portal-phase2h
```

## Expected result

The local runtime should pass even when Inventory tables are empty.

Read-only pages and APIs should show:

- authenticated access only
- organisation scoped access
- environment scoped access
- zero counts if no rows exist
- no create/edit/delete/import actions
- clear no-write wording

## Hard boundary

Phase 2H must not enable:

- item creation
- supplier creation
- movement creation
- purchase order mutation
- receiving confirmation
- stock mutation
- CSV upload
- CSV parsing
- import commit
- CRM/POS operational launch
