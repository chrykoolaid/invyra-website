# 🔒 INVYRA WEBSITE / PORTAL BUILD DEVELOPMENT PROGRAM v1

## Phase 1I — Inventory Portal Route QA + Runtime Guard Review

Status: COMPLETE

Baseline used:

```text
invyra_website_portal_phase1h_admin_configuration_shell_v1.zip
```

Output package:

```text
invyra_website_portal_phase1i_route_qa_runtime_guard_review_v1.zip
```

---

## Objective

Phase 1I reviewed and hardened the protected Inventory-first portal route layer before deeper Inventory implementation.

The goal was not to add new Inventory features. The goal was to ensure that:

```text
Navigation visibility
Runtime route guards
Module launcher destinations
Future module routing
Readiness route access
Verification coverage
```

all align with the locked Inventory-first portal direction.

---

## Completed Work

### 1. Runtime Permission Override Alignment

Updated:

```text
invyra-platform/lib/security/access-control.ts
```

The runtime `canAccessModule(...)` guard now honours user permission overrides.

This fixes an important mismatch:

```text
Before:
Portal visibility snapshot considered user overrides.
Runtime route guard did not.

After:
Portal visibility and runtime route guards both respect user permission overrides.
```

Denied user overrides now produce a specific audit reason:

```text
USER_PERMISSION_OVERRIDE_DENIED
```

Role permission absence remains audit-logged as:

```text
ROLE_PERMISSION_MISSING
```

Licence entitlement absence remains audit-logged as:

```text
LICENSE_ENTITLEMENT_MISSING
```

---

### 2. Readiness Route Guard Hardened

Updated:

```text
invyra-platform/app/portal/inventory/readiness/page.tsx
```

The Inventory readiness route now requires:

```text
getCurrentSession(...)
+
canAccessModule({ session, module: "INVENTORY", level: "VIEW" })
```

This aligns readiness with:

```text
/portal/inventory
/portal/inventory/setup
/portal/inventory/imports
/portal/inventory/[workflow]
```

---

### 3. Roadmap Routes Added

Added:

```text
invyra-platform/app/portal/roadmap/[module]/page.tsx
```

Controlled roadmap pages now exist for:

```text
/portal/roadmap/forecasting
/portal/roadmap/purchasing-extensions
/portal/roadmap/payroll
/portal/roadmap/time-tracking
/portal/roadmap/advanced-integrations
```

These pages are session-protected but non-operational.

They clearly state:

```text
Roadmap Module
Inventory First
No Launch
No fake backend data
No live customer data mutation
```

---

### 4. Future Module Link Safety Fixed

Updated:

```text
invyra-platform/lib/portal/module-catalog.ts
invyra-platform/components/PortalShell.tsx
invyra-platform/app/portal/page.tsx
```

Roadmap modules no longer deep-link into active Inventory workflow pages.

Corrected examples:

```text
Forecasting -> /portal/roadmap/forecasting
Purchasing Extensions -> /portal/roadmap/purchasing-extensions
Payroll -> /portal/roadmap/payroll
Time Tracking -> /portal/roadmap/time-tracking
Advanced Integrations -> /portal/roadmap/advanced-integrations
```

CRM and POS remain future-only pages:

```text
/portal/crm
/portal/pos
```

No CRM/POS operational Open or Launch route was added.

---

### 5. Sidebar Future Navigation Centralised

Updated:

```text
invyra-platform/components/PortalShell.tsx
```

Future navigation now derives from the shared module catalogue instead of a hardcoded partial list.

This prevents drift between:

```text
Portal Home
PortalShell sidebar
Module catalogue
Roadmap destinations
```

The Inventory navigation order was also improved so workflow routes remain the main Inventory block, with readiness/setup/import/admin configuration links after the workflow list.

---

### 6. Route QA Registry Added

Added:

```text
invyra-platform/lib/portal/portal-route-qa.ts
```

This records guard expectations for the protected portal layer, including:

```text
/portal
/portal/inventory
/portal/inventory/[workflow]
/portal/inventory/readiness
/portal/inventory/setup
/portal/inventory/imports
/portal/inventory/configuration
/portal/licensing
/portal/crm
/portal/pos
/portal/roadmap/[module]
```

---

### 7. Verification Script Added

Added:

```text
invyra-platform/scripts/verify-portal-phase1i.mjs
```

Updated:

```text
invyra-platform/package.json
```

New command:

```bash
npm run verify:portal-phase1i
```

The verification checks:

```text
Permission override runtime guard alignment
Readiness route guard alignment
Roadmap route existence
Future module route safety
No roadmap deep-links into active Inventory workflow routes
Known /portal route references only
Phase 1I QA registry presence
```

---

## Validation Result

Executed:

```bash
cd invyra-platform
npm run verify:portal-phase1i
npm run verify:portal-phase1h
npm run verify:portal-phase1g
npm run verify:portal-phase1f
npm run verify:portal-phase1e
npm run verify:portal-phase1d
```

Result:

```text
Portal Phase 1I verification passed.
Phase 1I route QA and runtime guard checks passed.
Portal Phase 1H verification passed.
Portal Phase 1G verification passed.
Portal Phase 1F verification passed.
Portal Phase 1E verification passed.
Portal Phase 1D verification passed.
```

Typecheck note:

```text
npm run typecheck was attempted, but the unpacked zip does not include node_modules / generated dependency types.
The failure was dependency/type-environment related, including missing Next, React JSX, Prisma client, Zod, bcryptjs, and Node type declarations.
This matches the known local-package limitation until npm install and Prisma generation are run in the developer environment.
```

---

## Boundary Maintained

Phase 1I did not add:

```text
Live Inventory backend connection
CSV upload
Parser
Database import
Item creation
Supplier creation
Purchase order submission
Receiving mutation
Stock movement mutation
Report generation
CRM implementation
POS implementation
Payment processing
Payroll implementation
Time tracking implementation
Third-party integrations
```

---

## Final Phase 1I Verdict

Phase 1I is complete.

The protected portal route layer is now safer and more consistent:

```text
Navigation visibility matches runtime guard behaviour.
Inventory readiness is properly guarded.
Roadmap modules route to controlled roadmap pages.
CRM/POS remain future-only.
No fake backend or operational roadmap access was introduced.
```

Recommended next scope:

```text
Phase 1J — Inventory Portal Runtime Smoke Test Pack + Local Verification Guide
```
