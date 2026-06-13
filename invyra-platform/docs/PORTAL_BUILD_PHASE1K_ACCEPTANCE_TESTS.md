# Phase 1K — Acceptance Tests

## Required Commands

From inside `invyra-platform`:

```bash
npm run verify:portal-phase1k
npm run verify:portal-phase1j
npm run verify:portal-phase1i
npm run verify:portal-phase1h
npm run verify:portal-phase1g
npm run verify:portal-phase1f
npm run verify:portal-phase1e
npm run verify:portal-phase1d
```

## Expected Result

All commands must pass.

## Manual Runtime Checks After `npm install`

Start the local server:

```bash
cd invyra-platform
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

In a second terminal:

```bash
cd invyra-platform
npm run smoke:portal
npm run review:portal-smoke-results
```

## Key Routes To Confirm

```text
/portal
/portal/inventory
/portal/inventory/items
/portal/inventory/orders
/portal/inventory/receiving
/portal/inventory/readiness
/portal/inventory/setup
/portal/inventory/imports
/portal/inventory/configuration
/portal/crm
/portal/pos
/portal/roadmap/forecasting
```

## Required Visual/Copy Confirmations

```text
Inventory Dashboard appears on /portal/inventory
Inventory First appears on /portal/inventory
Not Connected appears on /portal/inventory
Uploads remain disabled appears on /portal/inventory/imports
No database writes appears on /portal/inventory/imports
CRM shows Future Module / Coming Later / No Launch
POS shows Future Module / Coming Later / No Launch
Roadmap modules show Roadmap Module / Inventory First / No Launch
```

## Access Confirmations

```text
Logged-out /portal redirects to /login
Logged-out /portal/inventory redirects to /login
Owner can access Inventory portal routes
Non-admin users must not see Inventory Admin Configuration as a normal available action
/portal/inventory/configuration remains protected by INVENTORY.ADMINISTER
```

## Non-Goals

These must remain absent:

```text
No uploads
No parser
No import commits
No database writes from portal setup/import/configuration pages
No stock mutation
No supplier creation
No order submission
No receiving confirmation
No CRM launch button
No POS launch button
```
