# 🔒 INVYRA WEBSITE / PORTAL BUILD DEVELOPMENT PROGRAM v1

## Phase 1G — Inventory Portal Setup Actions + Data Import Preparation

**Status:** COMPLETE  
**Baseline used:** `invyra_website_portal_phase1f_empty_states_onboarding_readiness_v1.zip`  
**Output build:** `invyra_website_portal_phase1g_setup_actions_import_preparation_v1.zip`

---

## Objective

Phase 1G extends the Inventory-first protected portal with customer-safe setup guidance and import preparation structure before any live backend Inventory integration begins.

This phase moves the portal from:

```text
Inventory workflow shells + readiness flow
```

to:

```text
Inventory workflow shells + readiness flow + setup action board + import preparation contract
```

---

## Completed Implementation

### 1. Shared setup and import preparation model

Added:

```text
invyra-platform/lib/portal/inventory-setup-actions.ts
```

This centralises:

```text
Inventory setup actions
Setup state labels/classes
Setup summary logic
Next safe setup action logic
Import preparation templates
Import lifecycle stages
Import status labels/classes
```

Setup states:

```text
Complete
Needs Action
Prepared
Deferred
```

Import preparation statuses:

```text
Template Ready
Mapping Planned
Backend Deferred
```

---

### 2. New protected setup actions route

Added:

```text
invyra-platform/app/portal/inventory/setup/page.tsx
```

Route:

```text
/portal/inventory/setup
```

Protection:

```text
getCurrentSession(...)
canAccessModule({ module: "INVENTORY", level: "VIEW" })
PortalShell session context
```

The page shows:

```text
Organisation setup
Inventory licence setup
Role/permission setup
Environment separation setup
Team access setup
Device preparation
Workflow shell review
Data import template preparation
Backend connection boundary
```

No backend Inventory data is connected or mutated.

---

### 3. New protected data import preparation route

Added:

```text
invyra-platform/app/portal/inventory/imports/page.tsx
```

Route:

```text
/portal/inventory/imports
```

Protection:

```text
getCurrentSession(...)
canAccessModule({ module: "INVENTORY", level: "VIEW" })
PortalShell session context
```

The page documents preparation-only import templates for:

```text
Item Master Import
Supplier Import
Opening Stock Balance Import
Reorder Level Import
Supplier Item Mapping Import
```

Each template includes:

```text
Required columns
Optional columns
Validation rules
Safety rules
Backend boundary
Linked workflow
```

Important: the page intentionally includes no file input, upload handler, parser, createMany call, or stock mutation path.

---

### 4. PortalShell navigation updated

Updated:

```text
invyra-platform/components/PortalShell.tsx
```

Inventory navigation now includes:

```text
Readiness
Setup Actions
Data Import Prep
Dashboard
Items
Movements
Suppliers
Orders
Receiving
Wastage
Store Use
Reorder Review
Gap Scan
Stocktake
Reports
Training Mode
Settings
```

Setup Actions and Data Import Prep use the existing Inventory visibility model.

---

### 5. Inventory dashboard updated

Updated:

```text
invyra-platform/app/portal/inventory/page.tsx
```

Added:

```text
Setup Actions summary panel
Data Import Preparation panel
Hero links to setup/import pages
Preparation-only import boundary copy
```

The dashboard still shows no fake stock, supplier, order, report, receiving, or scan data.

---

### 6. Readiness flow updated

Updated:

```text
invyra-platform/lib/portal/inventory-readiness.ts
invyra-platform/app/portal/inventory/readiness/page.tsx
```

Added readiness coverage for:

```text
Prepare data import templates
Import preparation available / uploads disabled
```

This keeps data-import preparation inside the onboarding readiness story without implying upload functionality exists.

---

### 7. Workflow pages updated

Updated:

```text
invyra-platform/app/portal/inventory/[workflow]/page.tsx
```

Workflow pages now include:

```text
Setup Actions link
Import Preparation link
Review Setup Actions empty-state action
Backend connection and import uploads deferred wording
```

---

### 8. Styling added

Updated:

```text
invyra-platform/app/globals.css
```

Added Phase 1G styles for:

```text
setup hero cards
import hero cards
setup action board
setup action cards
setup dependency chips
import disabled panel
import template cards
import lifecycle cards
responsive layout behaviour
```

---

### 9. Route manifest updated

Updated:

```text
invyra-platform/docs/ROUTE_PROTECTION_MANIFEST.md
```

Added Phase 1G route protection and boundary notes.

---

### 10. Verification added

Added:

```text
invyra-platform/scripts/verify-portal-phase1g.mjs
```

Updated:

```text
invyra-platform/package.json
```

New command:

```bash
npm run verify:portal-phase1g
```

---

## Validation Results

Executed from `invyra-platform`:

```bash
npm run verify:portal-phase1g
npm run verify:portal-phase1f
npm run verify:portal-phase1e
npm run verify:portal-phase1d
```

Results:

```text
Portal Phase 1G verification passed.
Phase 1G setup actions and import preparation checks passed.
Portal Phase 1F verification passed.
Phase 1F static implementation checks passed.
Portal Phase 1E verification passed.
Portal Phase 1D verification passed.
```

Additional edited TS/TSX transpile check:

```text
Phase 1G edited TS/TSX transpile checks passed.
```

Full `tsc --noEmit` was not completed in this artifact environment because local `node_modules` are not installed. This is consistent with prior phases.

---

## Explicit Phase Boundary

Phase 1G does **not** implement:

```text
Real file upload
CSV parser
Spreadsheet parser
Import preview
Duplicate detection engine
Database writes
Item creation
Supplier creation
Opening balance stock mutation
Reorder threshold save
Supplier item mapping save
Purchase order creation
Live Inventory backend connection
```

Phase 1G is preparation-only.

---

## Acceptance Criteria Status

```text
✅ Setup Actions route exists
✅ Import Preparation route exists
✅ Both routes require Inventory view access
✅ PortalShell links added
✅ Inventory dashboard links added
✅ Readiness flow includes import preparation
✅ Workflow pages link to setup/import preparation
✅ No file input added
✅ No upload handler added
✅ No parser added
✅ No database import writes added
✅ No fake operational Inventory data added
✅ CRM/POS remain future-only
✅ Environment context remains visible
✅ Verification passed
```

---

## Recommended Next Scope

```text
Phase 1H — Inventory Portal Admin Configuration Shell
```

Recommended next work:

```text
Inventory settings/admin preparation
Threshold configuration shell
Workflow permission configuration shell
Import rules configuration shell
Training reset controls shell
Audit requirement checklist
No backend save actions yet unless explicitly scoped
```
