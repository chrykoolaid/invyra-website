# Phase 2B Acceptance Tests — Inventory Data Model Contract

## Status

PASS REQUIRED BEFORE PHASE 2C

## Acceptance Criteria

Phase 2B is accepted only when:

```text
Inventory data model contract exists.
Prisma schema draft exists outside live prisma/schema.prisma.
Tenant scoping rules are documented.
Environment separation rules are documented.
Permission/action matrix is documented.
Audit action taxonomy is documented.
Seed strategy is documented.
Read-only API contract is documented.
Phase 2B manifest exists.
Verifier exists.
package.json exposes npm run verify:portal-phase2b.
No live Inventory Prisma operational models are added to prisma/schema.prisma.
No /app/api/inventory route directory is added.
No uploads are enabled.
No CSV parser is added.
No Prisma writes are added.
No stock mutation is added.
No CRM/POS operational access is added.
```

## Required Command

```bash
cd invyra-platform
npm run verify:portal-phase2b
```

## Expected Result

```text
Portal Phase 2B verification passed.
Phase 2B Inventory data model contract checks passed.
```

## Regression Chain

Recommended regression chain:

```bash
npm run verify:portal-phase2b
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

## Explicit Failure Conditions

Fail Phase 2B if any of the following are present:

```text
model InventoryItem is added to live prisma/schema.prisma
model InventoryMovement is added to live prisma/schema.prisma
app/api/inventory exists
POST /api/inventory appears as an implemented route
Upload UI becomes enabled
CSV parser dependency is added
Inventory stock mutation code is added
CRM or POS receives Open/Launch operational access
```
