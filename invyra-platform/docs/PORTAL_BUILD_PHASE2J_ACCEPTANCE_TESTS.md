# PORTAL BUILD PHASE 2J ACCEPTANCE TESTS

## Static Package Verification

Run:

```bash
cd invyra-platform
npm run verify:portal-phase2j
```

Expected:

```text
Portal Phase 2J verification passed.
Phase 2J read-only demo runtime review checks passed.
```

## Local Runtime Verification

Prerequisites:

```bash
npm install
npm run prisma:migrate
npm run db:seed
npm run seed:inventory-readonly-demo
npm run dev
```

Then run in another terminal:

```bash
npm run smoke:inventory-demo-readonly
npm run review:inventory-demo-runtime-results
```

Expected runtime outcomes:

- Owner login succeeds.
- `/api/inventory/readiness` returns demo counts.
- `/api/inventory/items` returns at least three demo items.
- `/api/inventory/suppliers` returns at least two demo suppliers.
- `/api/inventory/movements` returns at least three demo movements.
- `/api/inventory/configuration` returns the demo read-only validation config.
- All returned meta flags show `writeEnabled: false`.
- All returned meta flags show `uploadsEnabled: false`.
- All returned meta flags show `stockMutationEnabled: false`.

## Boundaries

The following must remain absent:

- Inventory POST route handlers
- Upload endpoints
- Import commit endpoints
- Portal stock mutation actions
- CRM/POS operational Open buttons

## Static Result

Portal Phase 2J verification passed.
