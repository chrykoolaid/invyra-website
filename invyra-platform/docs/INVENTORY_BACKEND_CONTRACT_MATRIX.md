# Inventory Backend Contract Matrix — Phase 2A

## Contract Status Legend

```text
FOUNDATION READY = platform support already exists
CONTRACT NEEDED = data/API contract required before implementation
DEFER = intentionally not part of first backend wiring
```

| Portal Workflow | First Backend Need | Required Permission | Environment Rule | Phase 2A Status | Recommended Phase |
|---|---|---|---|---|---|
| Inventory Dashboard | readiness summary API | INVENTORY.VIEW | show current environment, no cross-environment aggregation | CONTRACT NEEDED | 2C |
| Items | item master table + read API | INVENTORY.VIEW | item records scoped per organisation/environment policy | CONTRACT NEEDED | 2B/2C |
| Movements | movement ledger table + read API | INVENTORY.VIEW | movement rows must include environment | CONTRACT NEEDED | 2B/2C |
| Suppliers | supplier table + read API | INVENTORY.VIEW | supplier operational state must be environment-aware if used for TEST/TRAINING | CONTRACT NEEDED | 2B/2C |
| Orders | purchase order schema | INVENTORY.VIEW first, CREATE/APPROVE later | TRAINING orders cannot submit to live supplier workflows | DEFER writes | 2D+ |
| Receiving | receiving session schema | INVENTORY.CREATE/EDIT later | receiving confirmation must create environment-scoped movements | DEFER writes | 2E+ |
| Wastage | wastage event schema | INVENTORY.CREATE/APPROVE later | stock reduction must never cross environment | DEFER writes | 2E+ |
| Store Use | store-use event schema | INVENTORY.CREATE/APPROVE later | stock reduction must never cross environment | DEFER writes | 2E+ |
| Reorder Review | reorder rules + demand/stock data | INVENTORY.VIEW first, APPROVE later | LIVE recommendations must only use LIVE data | DEFER calculations | 2F+ |
| Gap Scan | scan run + finding schema | INVENTORY.VIEW | TRAINING scans are practice only | DEFER calculations | 2F+ |
| Stocktake | stocktake session + line schema | INVENTORY.CREATE/APPROVE later | LIVE posting requires explicit approval | DEFER writes | 2F+ |
| Reports | read model/report queries | INVENTORY.VIEW | report output must label environment | DEFER exports | 2G+ |
| Training Mode | environment selection + training seed state | INVENTORY.VIEW | no LIVE mutation from TRAINING | FOUNDATION READY, data needed | 2C+ |
| Setup Actions | setup state service | INVENTORY.VIEW | setup state shown per organisation/environment | CONTRACT NEEDED | 2C |
| Import Preparation | import batch + preview schema later | INVENTORY.VIEW first, CREATE later | imports must target one environment only | DEFER upload/commit | 2F+ |
| Admin Configuration | persisted settings schema | INVENTORY.ADMINISTER | settings must be environment-scoped or explicitly global | CONTRACT NEEDED | 2B/2C |

---

## API Guard Contract

All Inventory API routes should start with the existing guard pattern:

```ts
const guard = await requirePlatformAccess({
  request,
  module: "INVENTORY",
  level: "VIEW"
});
```

For write routes, replace `VIEW` with the minimum required level:

```text
CREATE for new drafts or submissions
EDIT for controlled updates
APPROVE for approvals/posting
ADMINISTER for settings and admin configuration
```

---

## Response Contract Principles

1. Return organisation-scoped data only.
2. Return current-environment data only by default.
3. Include environment in the response metadata.
4. Include explicit empty states instead of fake rows.
5. Do not expose future CRM/POS operational links.
6. Do not mutate data from GET routes.
7. Use consistent error shapes from `lib/api/responses.ts`.
