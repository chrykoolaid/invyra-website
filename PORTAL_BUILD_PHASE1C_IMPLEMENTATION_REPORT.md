# 🔒 INVYRA WEBSITE / PORTAL BUILD DEVELOPMENT PROGRAM v1
# Phase 1C — Inventory Portal Workflow Route Skeletons Implementation Report

## Status

**Implementation status:** COMPLETE  
**Source baseline:** `invyra_website_portal_phase1b_inventory_first_shell_v1.zip`  
**New package baseline:** `invyra_website_portal_phase1c_inventory_workflow_routes_v1.zip`

Phase 1C converts the Inventory portal from a single dashboard route with loopback cards into protected workflow route skeletons.

---

## Implementation Summary

The protected Inventory portal now has route-level destinations for the major Inventory workflows while still avoiding fake backend claims.

Each workflow route:

```text
requires login
requires Inventory licence entitlement
requires environment access
uses the workflow's required Inventory permission level
shows LIVE / TRAINING / TEST context
states that backend data is not connected yet
lists what is prepared vs deferred
```

---

## Files Added

```text
invyra-platform/app/portal/inventory/[workflow]/page.tsx
invyra-platform/scripts/verify-portal-phase1c.mjs
invyra-platform/docs/PORTAL_BUILD_PHASE1C_IMPLEMENTATION_REPORT.md
invyra-platform/docs/PORTAL_BUILD_PHASE1C_ACCEPTANCE_TESTS.md
PORTAL_BUILD_PHASE1C_IMPLEMENTATION_REPORT.md
```

---

## Files Edited

```text
invyra-platform/lib/portal/module-catalog.ts
invyra-platform/components/PortalShell.tsx
invyra-platform/app/portal/inventory/page.tsx
invyra-platform/app/globals.css
invyra-platform/docs/ROUTE_PROTECTION_MANIFEST.md
invyra-platform/package.json
```

---

## Protected Inventory Routes Added

Implemented through the guarded dynamic route:

```text
/portal/inventory/[workflow]
```

Registered workflow URLs:

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

The main Inventory dashboard remains:

```text
/portal/inventory
```

---

## Workflow Catalogue Hardened

`lib/portal/module-catalog.ts` now stores route metadata for each Inventory workflow:

```text
slug
href
shortTitle
accessLevel
pageSummary
environmentRule
roleGuidance
readiness
preparedFor
deferredUntilBackend
```

This keeps the dashboard cards, sidebar navigation, and workflow pages aligned from one source of truth.

---

## Access Rules

Most workflow skeletons require:

```text
canAccessModule({ module: "INVENTORY", level: "VIEW" })
```

Inventory Settings requires:

```text
canAccessModule({ module: "INVENTORY", level: "ADMINISTER" })
```

This means staff can reach normal Inventory shells where licensed and allowed, while Inventory Settings remains admin-controlled.

---

## PortalShell Navigation Updated

The Inventory sidebar links now point to real route shells instead of all looping back to `/portal/inventory`.

Examples:

```text
Items -> /portal/inventory/items
Orders -> /portal/inventory/orders
Receiving -> /portal/inventory/receiving
Gap Scan -> /portal/inventory/gap-scan
Training Mode -> /portal/inventory/training-mode
Settings -> /portal/inventory/settings
```

---

## No Fake Backend Claims

The workflow routes intentionally show:

```text
Backend Claim: Not Connected
Shell route only until backend integration is scoped
Deferred Until Backend
```

No live stock counts, supplier records, purchase orders, receiving records, reports, wastage records, or stocktake records were fabricated.

---

## Validation Performed

Dependency-free verification script added:

```bash
cd invyra-platform
npm run verify:portal-phase1c
```

This checks:

```text
required files exist
all workflow URLs are registered in the catalogue
PortalShell derives Inventory navigation from the workflow catalogue
dynamic workflow route uses slug whitelist
dynamic workflow route uses Inventory entitlement guard
Inventory dashboard no longer uses the old loopback label
route protection manifest lists the workflow routes
```

Syntax parse checks were also run against edited TypeScript/TSX files using the available TypeScript transpiler.

Full `tsc --noEmit` was not run to completion because the uploaded package does not include installed dependencies. That remains a local validation step after `npm install`.

---

## Acceptance Status

```text
✅ Inventory workflow route skeletons exist
✅ Inventory sidebar points to real workflow route shells
✅ Inventory dashboard cards open workflow route shells
✅ Workflow routes are session-protected
✅ Workflow routes are Inventory-entitlement-protected
✅ Settings/Admin route requires Inventory ADMINISTER access
✅ Environment context remains visible
✅ Backend limitations are explicitly shown
✅ CRM and POS remain future modules from Phase 1B
✅ Route manifest updated
```

---

## Recommended Next Scope

```text
Phase 1D — Inventory Workflow Navigation + Permission Visibility Polish
```

Recommended next work:

```text
hide or soften workflow links based on role permission
add clear access denied guidance per workflow
create a workflow readiness matrix
prepare backend contract notes for Items, Movements, Orders, Receiving, and Stocktake
keep CRM/POS future-only
```
