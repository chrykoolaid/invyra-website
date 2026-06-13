# Portal Build Phase 2I Acceptance Tests

## Required Checks

- `prisma/seed-inventory-readonly-demo.ts` exists.
- `package.json` includes `seed:inventory-readonly-demo`.
- The demo seed targets `invyra_demo_organisation` by default.
- The seed covers LIVE, TRAINING, and TEST.
- The seed includes locations, items, suppliers, stock balances, movements, and configuration rows.
- The seed uses deterministic IDs/upserts for repeatable local runs.
- Phase 2I documentation exists.
- Phase 2I manifest exists.
- The portal/API read-only boundary remains documented.
- No upload, import, or stock mutation endpoint is introduced.

## Command

```bash
npm run verify:portal-phase2i
```

## Expected Result

```text
Portal Phase 2I verification passed.
```
