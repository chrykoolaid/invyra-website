# 🔒 Portal Phase 1J — Local Verification Guide

## Purpose

This guide verifies the protected Inventory-first portal locally after Phase 1J.

It does **not** enable backend Inventory operations. It only checks that the portal shell, protected routes, future module boundaries, and roadmap pages behave correctly in a local runtime.

---

## 1. Prepare the platform folder

```bash
cd invyra-platform
npm install
```

Copy the environment template:

```bash
cp .env.example .env
```

Then fill at least:

```text
DATABASE_URL=
SESSION_SECRET=
INVYRA_PLATFORM_ENV=LOCAL
```

---

## 2. Prepare Prisma and seed data

```bash
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

The smoke pack expects seeded users such as:

```text
owner@invyra.local
staff@invyra.local
```

Default password used by the smoke script:

```text
InvyraDemo#2026!
```

Override it when needed:

```bash
export INVYRA_SEED_PASSWORD="your-seed-password"
```

On Windows PowerShell:

```powershell
$env:INVYRA_SEED_PASSWORD="your-seed-password"
```

---

## 3. Run dependency-free static verification

This can run even before the local app server is started:

```bash
npm run verify:portal-phase1j
npm run verify:portal-phase1i
npm run verify:portal-phase1h
npm run verify:portal-phase1g
npm run verify:portal-phase1f
npm run verify:portal-phase1e
npm run verify:portal-phase1d
```

Required result:

```text
Portal Phase 1J verification passed.
Phase 1J runtime smoke pack and local guide checks passed.
```

---

## 4. Start the local server

Terminal 1:

```bash
npm run dev
```

Default target:

```text
http://localhost:3000
```

Override target when needed:

```bash
export INVYRA_PLATFORM_URL="http://localhost:3001"
```

PowerShell:

```powershell
$env:INVYRA_PLATFORM_URL="http://localhost:3001"
```

---

## 5. Run portal runtime smoke tests

Terminal 2:

```bash
npm run smoke:portal
```

Expected result:

```text
Invyra Portal Phase 1J runtime smoke tests
Passed: <number>
Failed: 0
Results written: portal-runtime-smoke-results.json
```

The script checks:

```text
Logged-out portal redirect behaviour
Owner login
Owner access to protected Inventory routes
Inventory workflow route availability
Inventory readiness/setup/import/configuration routes
CRM and POS future-only pages
Roadmap pages
Key content boundaries such as No Launch and Not Connected
Optional staff access checks
```

Disable staff smoke checks if the local seed is not using the expected staff permissions:

```bash
export INVYRA_PORTAL_SMOKE_INCLUDE_STAFF=false
npm run smoke:portal
```

PowerShell:

```powershell
$env:INVYRA_PORTAL_SMOKE_INCLUDE_STAFF="false"
npm run smoke:portal
```

---

## 6. Review smoke results

```bash
npm run review:portal-smoke-results
```

This reads:

```text
portal-runtime-smoke-results.json
```

If no real results file exists yet, it displays:

```text
docs/PORTAL_PHASE1J_SMOKE_TEST_RESULTS_TEMPLATE.json
```

---

## 7. Manual browser checks

Open the local app and verify these routes after logging in as an owner/admin:

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
/portal/licensing
/portal/crm
/portal/pos
/portal/roadmap/forecasting
/portal/roadmap/purchasing-extensions
/portal/roadmap/payroll
/portal/roadmap/time-tracking
/portal/roadmap/advanced-integrations
```

Confirm:

```text
Inventory is primary.
Environment context is visible.
Inventory routes are protected.
Admin configuration is not exposed as a normal staff action.
CRM and POS say Future Module / Coming Later / No Launch.
Roadmap modules do not open Inventory workflows.
No fake stock totals, supplier rows, purchase orders, receiving records, reports, or scan results are shown.
Uploads remain disabled.
No database writes are triggered by portal setup/import/configuration pages.
```

---

## 8. Known boundary

Full `npm run typecheck` and `npm run build` require installed dependencies and generated Prisma client.

If the package has just been unzipped, run:

```bash
npm install
npm run prisma:generate
npm run typecheck
npm run build
```

Dependency errors before `npm install` are expected and are not a Phase 1J portal implementation failure.
