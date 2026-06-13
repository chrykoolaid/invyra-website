# Portal Phase 2J — Demo Runtime Results Review Guide

## Purpose

Phase 2J validates that the Phase 2I read-only demo seed can be seen through the protected read-only Inventory APIs after a local seed run.

This is not a write-feature phase.

## Recommended Commands

```bash
cd invyra-platform
npm install
npm run prisma:migrate
npm run db:seed
npm run seed:inventory-readonly-demo
npm run dev
```

In a second terminal:

```bash
npm run smoke:inventory-demo-readonly
npm run review:inventory-demo-runtime-results
```

## Output Files

The smoke script writes:

```text
inventory-readonly-demo-runtime-results.json
```

The review script writes:

```text
inventory-readonly-demo-runtime-review.json
docs/PORTAL_PHASE2J_LOCAL_RUNTIME_RESULTS_REVIEW.md
```

## Pass Criteria

A Phase 2J local runtime pass requires:

- Demo rows are visible through protected API reads.
- Demo rows remain scoped to the logged-in organisation and environment.
- API metadata reports writes disabled.
- API metadata reports uploads disabled.
- API metadata reports stock mutation disabled.
- No CRM or POS operational access is introduced.

## Common Failure Causes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Login fails | Base seed not run or password override mismatch | Run `npm run db:seed` and verify env vars |
| Demo counts are zero | Demo seed not run or wrong organisation/environment | Run `npm run seed:inventory-readonly-demo` |
| API redirects | Session/route guard issue | Confirm login API and cookies |
| Boundary flags true | Read-only regression | Stop and inspect API metadata |

## Boundary

Do not use Phase 2J to add item creation, supplier creation, uploads, import commits, purchase orders, receiving confirmation, stock movement posting, CRM launch access, or POS launch access.
