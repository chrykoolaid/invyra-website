# Portal Build Phase 2H Acceptance Tests

## Required checks

- Phase 2H documentation exists.
- Inventory read-only API runtime smoke script exists.
- Inventory seed review script exists.
- Phase 2H verification script exists.
- Package scripts are registered.
- Read-only API routes remain GET-only implementation routes.
- Forbidden write/upload routes do not exist.
- No Inventory operational seed rows are required for pass.
- Phase 2G verification still passes.

## Commands

```bash
npm run verify:portal-phase2h
npm run verify:portal-phase2g
npm run verify:portal-phase2f
npm run verify:portal-phase2e
npm run verify:portal-phase2d
npm run verify:portal-phase2c
npm run verify:portal-phase2b
npm run verify:portal-phase2a
npm run verify:portal-phase1m
```

## Pass condition

The build passes if Phase 2H confirms runtime QA infrastructure and keeps the portal/API read-only.
