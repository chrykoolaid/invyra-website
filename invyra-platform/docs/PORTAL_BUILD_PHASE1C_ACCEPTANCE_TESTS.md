# Phase 1C Acceptance Tests — Inventory Portal Workflow Route Skeletons

## Scope

These tests validate the Inventory-first protected portal route skeletons. They do not validate live Inventory backend data.

## Required Route Tests

- [ ] `/portal/inventory` loads for a licensed Inventory user.
- [ ] `/portal/inventory/items` loads for a licensed Inventory user with Inventory VIEW access.
- [ ] `/portal/inventory/movements` loads for a licensed Inventory user with Inventory VIEW access.
- [ ] `/portal/inventory/suppliers` loads for a licensed Inventory user with Inventory VIEW access.
- [ ] `/portal/inventory/orders` loads for a licensed Inventory user with Inventory VIEW access.
- [ ] `/portal/inventory/receiving` loads for a licensed Inventory user with Inventory VIEW access.
- [ ] `/portal/inventory/wastage` loads for a licensed Inventory user with Inventory VIEW access.
- [ ] `/portal/inventory/store-use` loads for a licensed Inventory user with Inventory VIEW access.
- [ ] `/portal/inventory/reorder-review` loads for a licensed Inventory user with Inventory VIEW access.
- [ ] `/portal/inventory/gap-scan` loads for a licensed Inventory user with Inventory VIEW access.
- [ ] `/portal/inventory/stocktake` loads for a licensed Inventory user with Inventory VIEW access.
- [ ] `/portal/inventory/reports` loads for a licensed Inventory user with Inventory VIEW access.
- [ ] `/portal/inventory/training-mode` loads for a licensed Inventory user with Inventory VIEW access.
- [ ] `/portal/inventory/settings` requires Inventory ADMINISTER access.

## Protection Tests

- [ ] Logged-out users are redirected to `/login`.
- [ ] Users without Inventory licence entitlement are redirected to `/access-denied`.
- [ ] Users without required environment access are redirected to `/access-denied`.
- [ ] Users without Inventory ADMINISTER access cannot open `/portal/inventory/settings`.

## UI Tests

- [ ] Sidebar Inventory links point to specific workflow routes, not all to `/portal/inventory`.
- [ ] Inventory dashboard workflow cards use `Open Route Shell` for child workflows.
- [ ] Each workflow page shows the current environment banner.
- [ ] Each workflow page states backend data is not connected yet.
- [ ] Each workflow page lists prepared scope and deferred backend scope.
- [ ] CRM and POS remain Future Module / Coming Later.

## Dependency-Free Verification

```bash
cd invyra-platform
npm run verify:portal-phase1c
```

Expected result:

```text
Portal Phase 1C verification passed.
```

## Local Full Validation

Run after dependencies are installed:

```bash
cd invyra-platform
npm install
npm run prisma:generate
npm run typecheck
npm run build
```
