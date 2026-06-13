# Phase 1E Acceptance Tests — Inventory Workflow Detail Layouts

## Automated Check

Run:

```bash
cd invyra-platform
npm run verify:portal-phase1e
```

Expected result:

```text
Portal Phase 1E verification passed.
```

---

## Manual Browser Review

Review the following protected routes after logging in with an Inventory-licensed user:

```text
/portal/inventory/items
/portal/inventory/movements
/portal/inventory/suppliers
/portal/inventory/orders
/portal/inventory/receiving
/portal/inventory/wastage
/portal/inventory/store-use
/portal/inventory/reorder-review
/portal/inventory/gap-scan
/portal/inventory/stocktake
/portal/inventory/reports
/portal/inventory/training-mode
/portal/inventory/settings
```

Each page should show:

```text
✅ Environment banner
✅ Workflow-specific title
✅ Workflow-specific primary zone
✅ Workflow-specific secondary zone
✅ Planned columns
✅ Disabled planned actions
✅ Empty state that says backend is not connected yet
✅ Backend contract needed
✅ Safety rules
✅ Environment rule
✅ Role guidance
✅ Other Inventory route links
```

Each page must not show:

```text
❌ Fake stock data
❌ Fake item rows
❌ Fake supplier rows
❌ Fake purchase orders
❌ Fake receiving events
❌ Fake wastage events
❌ Fake scan results
❌ Fake report metrics
❌ Fake backend connected claims
```

---

## Access Checks

Expected:

```text
/portal/inventory/settings requires INVENTORY.ADMINISTER
Other Inventory workflow routes require INVENTORY.VIEW unless later scoped differently
Restricted users should be redirected to /access-denied by hard route guard
Sidebar visibility should remain soft-labelled without creating audit spam
```
