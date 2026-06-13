# Inventory Permission / Action Matrix — Phase 2B

## Status

CONTRACTED / NOT ENFORCED BY NEW INVENTORY APIs YET

The platform already supports these permission levels:

```text
VIEW
CREATE
EDIT
APPROVE
ADMINISTER
```

Phase 2B maps future Inventory actions to those levels.

| Workflow | Action | Required Permission | First Allowed Phase | Notes |
|---|---|---:|---:|---|
| Dashboard | View readiness and empty state | VIEW | 2C | Read-only only |
| Items | List items | VIEW | 2C | Environment-scoped |
| Items | Create item draft | CREATE | 2E | No stock mutation |
| Items | Edit item master | EDIT | 2E | Audit required |
| Items | Archive item | ADMINISTER | 2H | Must check dependencies |
| Movements | View movement ledger | VIEW | 2C | Immutable read |
| Movements | Create adjustment | APPROVE | 2H | Must post audit + stock projection |
| Suppliers | List suppliers | VIEW | 2C | Environment-scoped |
| Suppliers | Create supplier | CREATE | 2E | No PO action |
| Suppliers | Edit supplier | EDIT | 2E | Audit required |
| Orders | View order queue | VIEW | 2H | Deferred |
| Orders | Create draft PO | CREATE | 2H | Deferred |
| Orders | Submit PO | CREATE | 2H | Deferred |
| Orders | Approve / reject PO | APPROVE | 2H | Deferred |
| Receiving | View receiving queue | VIEW | 2H | Deferred |
| Receiving | Confirm receiving | CREATE | 2H | Stock mutation boundary |
| Receiving | Approve discrepancy | APPROVE | 2H | Audit required |
| Wastage | View wastage entries | VIEW | 2H | Deferred |
| Wastage | Submit wastage | CREATE | 2H | Stock mutation boundary |
| Wastage | Approve high-risk wastage | APPROVE | 2H | Rule-dependent |
| Store Use | View store-use entries | VIEW | 2H | Deferred |
| Store Use | Submit store use | CREATE | 2H | Stock mutation boundary |
| Reorder Review | View rules/recommendations | VIEW | 2H | Deferred |
| Reorder Review | Edit thresholds | EDIT | 2E | Configuration-controlled |
| Gap Scan | View scan results | VIEW | 2H | Deferred |
| Gap Scan | Run scan | CREATE | 2H | Deferred |
| Stocktake | View stocktake sessions | VIEW | 2H | Deferred |
| Stocktake | Start count | CREATE | 2H | Deferred |
| Stocktake | Approve variance | APPROVE | 2H | Stock mutation boundary |
| Imports | View import preparation | VIEW | 2C | Read-only shell |
| Imports | Upload CSV | CREATE | 2F | Preview only first |
| Imports | Commit import | APPROVE | 2G | Creates opening balance movements |
| Configuration | View configuration | VIEW | 2C | Read-only snapshot |
| Configuration | Save configuration | ADMINISTER | 2E | Audit required |

## Phase 2B Boundary

Phase 2B does not add these actions. It only defines the contract.
