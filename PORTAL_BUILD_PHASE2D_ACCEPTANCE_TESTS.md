# PORTAL BUILD PHASE 2D — ACCEPTANCE TESTS

## Required Pass Conditions

- Phase 2D activation plan exists.
- Phase 2D activation checklist exists.
- Migration safety rules exist.
- Rollback strategy exists.
- Schema activation candidate exists outside the live Prisma schema.
- Seed activation plan exists.
- Phase 2D manifest exists.
- Phase 2D verifier exists.
- `package.json` includes `verify:portal-phase2d`.
- Live `prisma/schema.prisma` is not modified by Phase 2D.
- Phase 2C read-only API foundation remains intact.
- Phase 2B data model contract remains intact.
- Phase 1 Inventory-first portal lock remains intact.

## Boundary Tests

Phase 2D must not introduce:

- live Inventory Prisma models in active schema
- migration files
- API writes
- upload handlers
- CSV parsers
- fake Inventory data
- stock mutation logic
- CRM/POS operational launch access

## Verification Command

```bash
cd invyra-platform
npm run verify:portal-phase2d
npm run verify:portal-phase2c
npm run verify:portal-phase2b
npm run verify:portal-phase2a
npm run verify:portal-phase1m
```
