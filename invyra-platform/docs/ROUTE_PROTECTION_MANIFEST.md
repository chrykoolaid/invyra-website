# Route Protection Manifest

## Purpose

This manifest classifies Phase 1A–1F routes by intended access level. It prevents accidental exposure as the platform grows.

## Public Routes

These routes are intentionally reachable before authentication.

```text
/login
/forgot-password
/reset-password
/activate
/onboarding/create-organisation
/api/auth/login
/api/auth/forgot-password
/api/auth/reset-password
/api/auth/session
/api/devices/activate
/api/onboarding/access-request
```

## Session-Context Routes

These routes may be called without a role-level module action but must not expose sensitive organisation data unless a valid session exists.

```text
/api/auth/session
/api/environments/current
```

Expected behavior:

```text
No session = 401 or authenticated:false
Valid session = current user/organisation/environment context only
```

## Protected Routes

These routes require server-side authentication, organisation membership, permission checks, and where applicable licence/environment checks.

```text
/portal
/portal/inventory
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
/portal/crm
/portal/pos
/portal/admin/organisation
/portal/admin/users
/portal/admin/environments
/portal/admin/onboarding
/portal/admin/audit
/portal/admin/security
/portal/licensing
/portal/devices

/api/users
/api/users/invite
/api/users/:id/activate
/api/users/:id/suspend
/api/users/:id/deactivate
/api/users/:id/role

/api/organisations/current
/api/organisations/settings

/api/licensing
/api/licensing/create
/api/licensing/modules/allocate
/api/licensing/users/allocate
/api/licensing/devices/allocate
/api/licensing/consumption
/api/licensing/:id/status
/api/licensing/:id/expiry

/api/devices
/api/devices/activation-code
/api/devices/:id/suspend
/api/devices/:id/retire

/api/environments
/api/environments/switch

/api/onboarding/access-requests
/api/onboarding/access-requests/:id/attach
/api/onboarding/access-requests/:id/review
/api/onboarding/workflows
/api/onboarding/workflows/current
/api/onboarding/workflows/:id
/api/onboarding/workflows/:id/steps/:stepKey
/api/onboarding/workflows/:id/complete

/api/audit
/api/audit/security
/api/audit/access-denied
/api/security/sessions
/api/security/sessions/:id/revoke
```

## Protection Rule

Protected routes must use one of the following server-side patterns:

```text
requirePlatformAccess(...)
```

or:

```text
getCurrentSession(...)
+
canAccessModule(...)
```

Session-context routes must at minimum use:

```text
getCurrentSession(...)
```

## Public Route Rule

Public routes must still avoid leaking sensitive internal details. Public request/activation routes should return controlled messages and audit security-relevant outcomes where possible.


## Wave 8 / Portal Build Development Phase 1B Addendum

The protected portal has been hardened around the Inventory-first commercial direction.

```text
/portal/inventory
```

Requires:

```text
getCurrentSession(...)
+
canAccessModule({ module: "INVENTORY", level: "VIEW" })
```

The following routes are protected by session but intentionally do not grant operational module access yet:

```text
/portal/crm
/portal/pos
```

They are controlled Future Module / Coming Later pages. They must not show active CRM or POS launch workflows until those modules are explicitly scoped and commercially ready.


## Portal Build Development Phase 1C Addendum

The Inventory portal now has protected workflow route skeletons.

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

These routes are implemented through:

```text
/portal/inventory/[workflow]
```

Protection expectations:

```text
getCurrentSession(...)
+
canAccessModule({ module: "INVENTORY", level: workflow.accessLevel })
```

The workflow pages are shell routes only. They must not show fake live item, order, receiving, wastage, stocktake, or report data until backend Inventory integration is explicitly scoped.


## Portal Build Development Phase 1D Addendum

The portal now includes non-auditing permission visibility for navigation and module cards.

Rendering the PortalShell must not call:

```text
canAccessModule(...)
```

because sidebar rendering should not create access-denied audit events.

Instead, the shell uses:

```text
getPortalAccessSnapshot(...)
```

for soft UI visibility states:

```text
Available
Restricted
Licence Required
Coming Later
Roadmap Module
```

Hard route protection remains mandatory on protected destination pages.

New explicit route guard alignments:

```text
/portal/licensing
  getCurrentSession(...)
  + canAccessModule({ module: "LICENSING", level: "VIEW" })

/portal/admin/tenant-verification
  getCurrentSession(...)
  + canAccessModule({ module: "ADMINISTRATION", level: "VIEW" })

/portal/admin/organisation
  getCurrentSession(...)
  + canAccessModule({ module: "ADMINISTRATION", level: "VIEW" })

/portal/admin/onboarding
  getCurrentSession(...)
  + canAccessModule({ module: "ADMINISTRATION", level: "VIEW" })
```

Inventory workflow routes remain protected by:

```text
canAccessModule({ module: "INVENTORY", level: workflow.accessLevel })
```


## Portal Build Development Phase 1E Addendum

The Inventory workflow routes now render workflow-specific detail layouts instead of one generic skeleton template.

Implementation source:

```text
lib/portal/inventory-workflow-layouts.ts
app/portal/inventory/[workflow]/page.tsx
```

The following protected routes still use the same hard guard pattern:

```text
getCurrentSession(...)
+
canAccessModule({ module: "INVENTORY", level: workflow.accessLevel })
```

Phase 1E does not connect backend Inventory data. No fake operational data, fake stock counts, fake supplier rows, fake purchase orders, fake reports, or fake scan results may be shown.

Each workflow page may show only:

```text
workflow-specific layout structure
planned columns
planned disabled actions
backend contract notes
safety rules
environment guidance
role guidance
empty states
```

## Portal Build Development Phase 1F Addendum

The Inventory portal now includes an onboarding readiness route and guided empty-state governance.

New readiness route:

```text
/portal/inventory/readiness
```

Implementation source:

```text
lib/portal/inventory-readiness.ts
app/portal/inventory/readiness/page.tsx
```

Protection expectations:

```text
getCurrentSession(...)
+
PortalShell session context
+
getPortalAccessSnapshot(...)
```

The readiness route is intentionally setup-oriented. It may show whether Inventory licence, role access, organisation context, environment access, users, devices, and workflow shells are ready. It must not display live stock data, fake stock data, supplier rows, purchase orders, movement records, reports, or scan results.

Phase 1F also adds readiness links to:

```text
/portal
/portal/onboarding
/portal/inventory
/portal/inventory/[workflow]
components/PortalShell.tsx
```

Inventory workflow empty states must now include:

```text
clear missing-data explanation
safe readiness next action
backend-deferred wording
environment separation reminder
no sample operational records
```

Backend connection remains deferred until a later explicitly scoped Inventory integration phase.

## Portal Build Development Phase 1G Addendum

The Inventory portal now includes setup-action and data-import preparation destinations.

New protected preparation routes:

```text
/portal/inventory/setup
/portal/inventory/imports
```

Implementation source:

```text
lib/portal/inventory-setup-actions.ts
app/portal/inventory/setup/page.tsx
app/portal/inventory/imports/page.tsx
```

Protection expectations:

```text
getCurrentSession(...)
+
canAccessModule({ module: "INVENTORY", level: "VIEW" })
+
PortalShell session context
```

Phase 1G is preparation-only. It may show setup actions, template columns, validation rules, safety rules, and backend boundaries. It must not enable file upload, parsing, import preview, database writes, supplier creation, item creation, purchase order generation, opening stock balance mutation, or live stock adjustment.

The following import preparation templates are documented only:

```text
Item Master Import
Supplier Import
Opening Stock Balance Import
Reorder Level Import
Supplier Item Mapping Import
```

Import uploads remain disabled. Backend connection, CSV parsing, duplicate detection, preview approval, audit commit, and rollback evidence remain deferred until a dedicated backend import implementation phase is explicitly scoped.

## Portal Build Development Phase 1H Addendum

The Inventory portal now includes an admin-only configuration shell.

New protected admin configuration route:

```text
/portal/inventory/configuration
```

Implementation source:

```text
lib/portal/inventory-admin-configuration.ts
app/portal/inventory/configuration/page.tsx
```

Protection expectations:

```text
getCurrentSession(...)
+
canAccessModule({ module: "INVENTORY", level: "ADMINISTER" })
+
PortalShell session context
```

Phase 1H is configuration-shell only. It may show planned Inventory settings groups, disabled controls, safety rules, environment scope notes, and backend configuration contracts. It must not show editable forms, save buttons, upload controls, backend configuration writes, Prisma mutation calls, live stock mutation, stock rule persistence, reorder engine activation, scanner automation, report generation, or supplier/receiving workflow changes.

The configuration shell groups these future admin areas:

```text
Stock Rules
Item Master Rules
Supplier & Purchasing Rules
Receiving & Discrepancy Rules
Wastage & Store Use Rules
Reorder Review & Gap Scan Rules
Stocktake Rules
Training Mode Rules
Reporting & Export Rules
Device & Scanner Rules
```

All future Inventory configuration persistence must be environment-scoped and audit-logged before any setting can be saved.

## Portal Build Development Phase 1I Addendum

The Inventory-first portal now includes an explicit route QA and runtime guard review layer.

New QA source:

```text
lib/portal/portal-route-qa.ts
scripts/verify-portal-phase1i.mjs
```

New controlled roadmap route:

```text
/portal/roadmap/[module]
```

Roadmap route coverage:

```text
/portal/roadmap/forecasting
/portal/roadmap/purchasing-extensions
/portal/roadmap/payroll
/portal/roadmap/time-tracking
/portal/roadmap/advanced-integrations
```

Runtime guard correction:

```text
lib/security/access-control.ts
```

`canAccessModule(...)` now honours user permission overrides before final route access is approved or denied. This aligns runtime route protection with the non-auditing portal visibility snapshot used by `PortalShell` and module cards.

Protection expectations:

```text
Portal rendering visibility:
getCurrentSession(...)
+
getPortalAccessSnapshot(...)
+
no access-denied audit log from normal navigation rendering

Operational/preparation route entry:
getCurrentSession(...)
+
canAccessModule(...)
+
access-denied redirect and audit log when denied
```

Phase 1I route corrections:

```text
/portal/inventory/readiness now requires INVENTORY.VIEW
Roadmap modules no longer deep-link into active Inventory workflow routes
Future CRM/POS remain session-protected information pages only
Forecasting/Purchasing/Payroll/Time Tracking/Advanced Integrations now use controlled roadmap pages
```

Roadmap routes must not provide operational Open / Launch paths, backend mutations, file uploads, Prisma writes, stock movement, order submission, payroll actions, attendance actions, third-party sync, or live customer data mutation.

## Portal Build Development Phase 1J Addendum

The Inventory-first portal now includes a local runtime smoke test pack and verification guide.

New QA sources:

```text
scripts/portal-runtime-smoke.mjs
scripts/portal-smoke-results-review.mjs
scripts/verify-portal-phase1j.mjs
docs/PORTAL_PHASE1J_LOCAL_VERIFICATION_GUIDE.md
docs/PORTAL_PHASE1J_SMOKE_TEST_MANIFEST.json
docs/PORTAL_PHASE1J_SMOKE_TEST_RESULTS_TEMPLATE.json
```

New package scripts:

```text
npm run verify:portal-phase1j
npm run smoke:portal
npm run review:portal-smoke-results
```

Runtime smoke coverage:

```text
Logged-out portal redirects
Seed owner login
Protected portal home
Protected Inventory dashboard
Inventory workflow routes
Inventory readiness/setup/import/configuration pages
Licensing page
CRM and POS future-only pages
Roadmap pages
Key boundary copy: Inventory First, Not Connected, Coming Later, No Launch, Roadmap Module
Optional staff access checks
```

Phase 1J is QA-only. It must not introduce uploads, parsers, Prisma writes, live stock mutation, supplier creation, purchase order mutation, receiving mutation, report generation, CRM launch access, POS launch access, billing, or payment processing.

## Portal Build Development Phase 1K Addendum

Phase 1K is a local runtime bug fix pass for the Inventory-first protected portal.

Changed runtime/QA files:

```text
app/portal/inventory/page.tsx
app/portal/inventory/[workflow]/page.tsx
app/portal/inventory/imports/page.tsx
scripts/portal-runtime-smoke.mjs
scripts/verify-portal-phase1k.mjs
```

Corrections:

```text
Removed accidental duplicate workflow layout grid wrapper
Aligned runtime smoke-test copy with visible page text
Added explicit Inventory Dashboard / Inventory First / Not Connected copy
Added explicit Uploads remain disabled / No database writes copy
Made Admin Configuration action labels permission-aware in touched Inventory pages
Hardened smoke-test Set-Cookie extraction
Added redirect location output for smoke-test failures
```

Protection expectations remain unchanged:

```text
/portal/inventory requires INVENTORY.VIEW
/portal/inventory/[workflow] requires the workflow access level
/portal/inventory/readiness requires INVENTORY.VIEW
/portal/inventory/setup requires INVENTORY.VIEW
/portal/inventory/imports requires INVENTORY.VIEW
/portal/inventory/configuration requires INVENTORY.ADMINISTER
/portal/crm is future-only information
/portal/pos is future-only information
/portal/roadmap/[module] is roadmap-only information
```

Phase 1K must not introduce backend Inventory data, uploads, CSV parsing, Prisma writes, stock mutations, supplier creation, purchase order mutation, receiving mutation, CRM launch access, or POS launch access.

## Portal Build Development Phase 1L Addendum

Phase 1L adds a local runtime results review layer for the Inventory-first protected portal.

New QA/review files:

```text
scripts/portal-runtime-results-report.mjs
scripts/verify-portal-phase1l.mjs
docs/PORTAL_PHASE1L_LOCAL_RUNTIME_RESULTS_REVIEW_GUIDE.md
docs/PORTAL_PHASE1L_RESULTS_REVIEW_CHECKLIST.md
docs/PORTAL_PHASE1L_RESULTS_REVIEW_TEMPLATE.md
docs/PORTAL_BUILD_PHASE1L_IMPLEMENTATION_REPORT.md
docs/PORTAL_BUILD_PHASE1L_ACCEPTANCE_TESTS.md
```

New package scripts:

```text
npm run review:portal-runtime-results
npm run verify:portal-phase1l
```

Phase 1L does not change route protection rules. It reviews the runtime smoke-test output produced by:

```text
npm run smoke:portal
```

The review generator reads:

```text
portal-runtime-smoke-results.json
```

and writes:

```text
docs/PORTAL_PHASE1L_LOCAL_RUNTIME_RESULTS_REVIEW.md
```

If no runtime result file exists yet, the generator creates a NOT RUN review from the Phase 1J template instead of pretending runtime validation passed.

Phase 1L remains QA/review-only and must not introduce backend Inventory data, uploads, CSV parsing, Prisma writes, stock mutations, supplier creation, purchase order mutation, receiving mutation, CRM launch access, or POS launch access.

## Portal Build Development Phase 1M Final Lock Addendum

Phase 1M locks the Inventory-first protected portal Phase 1 baseline.

New final lock files:

```text
PORTAL_BUILD_PHASE1M_FINAL_LOCK_REPORT.md
PORTAL_BUILD_PHASE1M_ACCEPTANCE_TESTS.md
docs/PORTAL_BUILD_PHASE1M_FINAL_LOCK_REPORT.md
docs/PORTAL_BUILD_PHASE1M_ACCEPTANCE_TESTS.md
docs/PORTAL_PHASE1_FINAL_LOCK_MANIFEST.json
scripts/verify-portal-phase1m.mjs
```

New package script:

```text
npm run verify:portal-phase1m
```

Phase 1M does not change runtime route protection rules. It consolidates the locked Phase 1 route position:

```text
Active Inventory-first routes:
/portal
/portal/inventory
/portal/inventory/[workflow]
/portal/inventory/readiness
/portal/inventory/setup
/portal/inventory/imports
/portal/inventory/configuration

Platform foundation routes:
/portal/licensing
/portal/devices
/portal/admin/organisation
/portal/admin/users
/portal/admin/environments
/portal/admin/audit
/portal/admin/security
/portal/admin/tenant-verification
/portal/admin/onboarding
/portal/admin/qa

Future-only routes:
/portal/crm
/portal/pos
/portal/roadmap/[module]
```

Final Phase 1 lock boundaries:

```text
Inventory is Available First
CRM and POS remain Future Module / Coming Later
Forecasting, Purchasing Extensions, Payroll, Time Tracking, and Advanced Integrations remain roadmap-only
No uploads, CSV parsing, Prisma writes, stock mutation, supplier creation, purchase order submission, receiving confirmation, CRM launch access, or POS launch access are introduced
```

Recommended next program:

```text
Phase 2A — Inventory Backend Integration Readiness Audit
```

## Portal Build Development Phase 2A Backend Integration Readiness Audit Addendum

Phase 2A adds backend integration readiness documentation and verification only. It does not change protected portal route behaviour and does not add Inventory API routes or Inventory Prisma operational models.

New audit files:

```text
PORTAL_BUILD_PHASE2A_IMPLEMENTATION_REPORT.md
PORTAL_BUILD_PHASE2A_ACCEPTANCE_TESTS.md
docs/PORTAL_BUILD_PHASE2A_IMPLEMENTATION_REPORT.md
docs/PORTAL_BUILD_PHASE2A_ACCEPTANCE_TESTS.md
docs/INVENTORY_BACKEND_INTEGRATION_READINESS_AUDIT.md
docs/INVENTORY_BACKEND_CONTRACT_MATRIX.md
docs/INVENTORY_BACKEND_MODEL_GAP_REGISTER.md
docs/INVENTORY_BACKEND_PHASE2_ROADMAP.md
docs/PORTAL_PHASE2A_BACKEND_READINESS_MANIFEST.json
scripts/verify-portal-phase2a.mjs
```

New package script:

```text
npm run verify:portal-phase2a
```

Phase 2A confirms the existing route guard pattern should be reused for future Inventory APIs:

```text
requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" })
requirePlatformAccess({ request, module: "INVENTORY", level: "CREATE" })
requirePlatformAccess({ request, module: "INVENTORY", level: "EDIT" })
requirePlatformAccess({ request, module: "INVENTORY", level: "APPROVE" })
requirePlatformAccess({ request, module: "INVENTORY", level: "ADMINISTER" })
```

Phase 2A preserves the Phase 1M route boundary:

```text
Active Inventory-first portal routes remain shell/readiness routes.
CRM and POS remain future-only.
Roadmap modules remain roadmap-only.
No Inventory API route, Inventory Prisma model, upload, parser, import commit, stock mutation, purchase order submission, receiving confirmation, or report generation is introduced.
```

Recommended next phase:

```text
Phase 2B — Inventory Data Model Contract
```

## Portal Build Development Phase 2B Inventory Data Model Contract Addendum

Phase 2B adds the Inventory data model contract for future backend work. It does not change protected portal route behaviour and does not add live Inventory API routes or live Inventory Prisma operational models.

New contract files:

```text
PORTAL_BUILD_PHASE2B_IMPLEMENTATION_REPORT.md
PORTAL_BUILD_PHASE2B_ACCEPTANCE_TESTS.md
docs/PORTAL_BUILD_PHASE2B_IMPLEMENTATION_REPORT.md
docs/PORTAL_BUILD_PHASE2B_ACCEPTANCE_TESTS.md
docs/INVENTORY_DATA_MODEL_CONTRACT.md
docs/INVENTORY_PRISMA_SCHEMA_DRAFT.prisma
docs/INVENTORY_TENANT_ENVIRONMENT_RULES.md
docs/INVENTORY_PERMISSION_ACTION_MATRIX.md
docs/INVENTORY_AUDIT_ACTION_TAXONOMY.md
docs/INVENTORY_SEED_STRATEGY.md
docs/INVENTORY_READ_ONLY_API_CONTRACT.md
docs/PORTAL_PHASE2B_DATA_MODEL_CONTRACT_MANIFEST.json
lib/inventory/inventory-data-model-contract.ts
scripts/verify-portal-phase2b.mjs
```

New package script:

```text
npm run verify:portal-phase2b
```

Phase 2B contracted first model slice:

```text
InventoryLocation
InventoryItem
InventoryStockBalance
InventoryMovement
InventorySupplier
InventorySupplierItem
InventoryConfiguration
InventoryImportBatch
InventoryImportRow
```

Phase 2B contracted first read-only API candidates for Phase 2C:

```text
GET /api/inventory/readiness
GET /api/inventory/items
GET /api/inventory/suppliers
GET /api/inventory/movements
GET /api/inventory/configuration
```

Phase 2B preserves the following boundaries:

```text
No live Prisma Inventory operational models are added to prisma/schema.prisma.
No app/api/inventory route directory is added.
No upload endpoint is enabled.
No CSV parser is added.
No import commit is added.
No opening balance posting is added.
No stock mutation is added.
No purchase order submission is added.
No receiving confirmation is added.
CRM and POS remain Future Module / Coming Later only.
```

Recommended next phase:

```text
Phase 2C — Read-only Inventory API Foundation
```

---

## Portal Build Development Phase 2C Read-only Inventory API Foundation Addendum

Phase 2C adds the first protected Inventory API route surface.

```text
GET /api/inventory/readiness      INVENTORY.VIEW
GET /api/inventory/items          INVENTORY.VIEW
GET /api/inventory/suppliers      INVENTORY.VIEW
GET /api/inventory/movements      INVENTORY.VIEW
GET /api/inventory/configuration  INVENTORY.ADMINISTER
```

Rules:

```text
No Inventory write methods are enabled.
No live Inventory Prisma model queries are introduced.
No uploads, CSV parsing, stock mutation, item creation, supplier creation, PO submission, or receiving confirmation are enabled.
All routes must return honest read-only metadata and empty operational records until Prisma Inventory models are activated in a later phase.
```

---

# Phase 2D Addendum — Inventory Prisma Schema Activation Plan

Phase 2D adds schema activation planning only.

No route behaviour is changed.
No live Prisma Inventory models are activated.
No migration is generated.
No Inventory writes are enabled.

Verification command:

```bash
npm run verify:portal-phase2d
```

---

## Phase 2E Addendum — Inventory Prisma Schema Activation

Phase 2E activates Inventory Prisma models and a PostgreSQL migration scaffold.

Runtime portal/API guard behaviour remains unchanged:

- Inventory portal routes remain protected.
- Inventory API routes remain read-only.
- Configuration API remains INVENTORY.ADMINISTER gated.
- No Inventory write/upload/import/stock mutation routes are enabled.
- CRM and POS remain future-only.

New verification command:

```bash
npm run verify:portal-phase2e
```


---

## Phase 2F Addendum — Read-only Inventory Data Service Wiring

The protected Inventory API routes are now wired to a dedicated read-only service layer.

Routes remain protected as follows:

```text
/api/inventory/readiness       INVENTORY.VIEW
/api/inventory/items           INVENTORY.VIEW
/api/inventory/suppliers       INVENTORY.VIEW
/api/inventory/movements       INVENTORY.VIEW
/api/inventory/configuration   INVENTORY.ADMINISTER
```

All reads are scoped by organisation and environment. Writes, uploads, imports, and stock mutation remain disabled.

---

## Phase 2G Addendum — Inventory Read-only Portal Data Binding

Status: Implemented / lock-ready.

Protected portal UI now binds to the Phase 2F read-only Inventory service layer:

- `/portal/inventory` displays read-only Inventory counts and preview panels.
- `/portal/inventory/items` displays read-only item rows when present.
- `/portal/inventory/suppliers` displays read-only supplier rows when present.
- `/portal/inventory/movements` displays read-only movement rows when present.
- `/portal/inventory/settings` displays read-only configuration rows only behind Inventory administer access.

No write routes, upload routes, import commit routes, or stock mutation routes are enabled by Phase 2G.


## Phase 2H Addendum — Inventory Read-only Runtime QA + Local Data Seed Review

Phase 2H adds QA and review tooling only.

New local QA scripts:

- `npm run smoke:inventory-readonly-api`
- `npm run review:inventory-seed`
- `npm run verify:portal-phase2h`

Route posture remains unchanged from Phase 2G:

- Inventory portal routes remain protected.
- Inventory read-only API routes remain protected.
- Configuration API requires Inventory administration access.
- No write/upload/import API routes are introduced.
- Empty Inventory tables are valid and must render honest empty states.

## Phase 2I Addendum — Inventory Read-only Demo Seed Pack

Phase 2I adds local demo seed tooling only.

No new portal routes or API mutation routes are introduced.

The protected Inventory portal and API remain read-only:

- no create routes
- no upload routes
- no import commit routes
- no stock mutation routes
- no CRM/POS launch access

New local command:

```bash
npm run seed:inventory-readonly-demo
```

This command creates deterministic local demo rows for read-only validation after the base platform seed has created the demo organisation.

## Phase 2J Addendum — Read-only Demo Runtime Results Review

Phase 2J adds runtime QA scripts and review documentation for seeded read-only Inventory demo data.

No new portal write routes are introduced.

Added scripts:

- `npm run smoke:inventory-demo-readonly`
- `npm run review:inventory-demo-runtime-results`
- `npm run verify:portal-phase2j`

Protected Inventory API routes remain read-only:

- `/api/inventory/readiness`
- `/api/inventory/items`
- `/api/inventory/suppliers`
- `/api/inventory/movements`
- `/api/inventory/configuration`

CRM and POS remain Future Module / Coming Later only.


## Phase 2K Addendum — Inventory Read-only Demo Portal UX QA

- Protected Inventory portal pages now include Phase 2K demo UX review labels.
- Read-only demo tables remain display-only.
- No POST/PUT/PATCH/DELETE Inventory routes are introduced.
- CRM and POS remain Future Module / Coming Later only.
