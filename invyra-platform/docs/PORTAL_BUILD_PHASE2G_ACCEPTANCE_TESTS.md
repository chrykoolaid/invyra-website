# PORTAL BUILD PHASE 2G ACCEPTANCE TESTS

## Required Checks

- `/portal/inventory` imports the read-only portal binding helper.
- `/portal/inventory` displays read-only counts for Items, Suppliers, Movements, Stock Balances, and Configuration readiness.
- `/portal/inventory` renders read-only preview panels.
- `/portal/inventory/[workflow]` renders a workflow-specific read-only table.
- Items, Suppliers, Movements, and Settings/Admin workflows are bound to their read-only collections.
- Other workflows show read-only backend readiness only.
- Configuration preview is not exposed to users without Inventory administer visibility.
- Uploads remain disabled.
- Writes remain disabled.
- Stock mutation remains disabled.
- CRM and POS remain future-only.

## Automated Verification

Run:

```bash
cd invyra-platform
npm run verify:portal-phase2g
npm run verify:portal-phase2f
npm run verify:portal-phase2e
npm run verify:portal-phase2d
npm run verify:portal-phase2c
npm run verify:portal-phase2b
npm run verify:portal-phase2a
npm run verify:portal-phase1m
```

Expected result:

```text
Portal Phase 2G verification passed.
Phase 2G read-only portal data binding checks passed.
```
