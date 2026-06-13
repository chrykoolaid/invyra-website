# 🔒 INVYRA WEBSITE / PORTAL BUILD DEVELOPMENT PROGRAM v1

## Phase 1D — Inventory Workflow Navigation + Permission Visibility Polish

**Status:** COMPLETE  
**Baseline used:** `invyra_website_portal_phase1c_inventory_workflow_routes_v1.zip`  
**New build:** `invyra_website_portal_phase1d_permission_visibility_v1.zip`

---

## Objective

Phase 1D hardens the protected portal so Inventory workflow navigation and module launcher cards are visibly licence-aware, role-aware, permission-aware, and environment-aware before backend Inventory data is connected.

This phase does **not** introduce live stock data, fake metrics, CRM operations, POS operations, or backend Inventory workflow actions.

---

## Completed

### 1. Non-auditing portal permission snapshot added

Added:

```text
invyra-platform/lib/portal/portal-access.ts
```

This file prepares safe portal rendering logic without writing access-denied audit events during normal page render.

It supports:

```text
- Active licence module checks
- Current environment access checks
- Role permission checks
- User permission override checks
- Module visibility state labels
- Workflow visibility state labels
```

Visibility states:

```text
Available
Restricted
Licence Required
Coming Later
Roadmap Module
```

---

### 2. PortalShell navigation hardened

Updated:

```text
invyra-platform/components/PortalShell.tsx
```

Navigation now renders with soft visibility states:

```text
Inventory
- Available workflows remain clickable
- Restricted workflows are shown as Restricted and are not clickable
- Licence-required workflows route users to Licensing

Platform
- Platform foundation links respect licence + role visibility
- Restricted links are labelled instead of silently exposed

Future
- CRM remains Coming Later
- POS remains Coming Later
- Forecasting remains Roadmap
```

Important: this avoids audit-log noise. Rendering the sidebar does not call `canAccessModule(...)`.

---

### 3. Portal Home cards now respect permission visibility

Updated:

```text
invyra-platform/app/portal/page.tsx
```

Portal Home now uses the permission snapshot to decide whether cards show:

```text
Available
Restricted
Licence Required
Coming Later
Roadmap Module
```

Inventory remains the only active commercial product destination.

CRM and POS remain secondary and roadmap-only.

---

### 4. Inventory Dashboard workflow cards now respect access level

Updated:

```text
invyra-platform/app/portal/inventory/page.tsx
```

Each Inventory workflow card now shows its required access level, for example:

```text
INVENTORY.VIEW
INVENTORY.ADMINISTER
```

Restricted workflow cards no longer expose a working route button.

This is especially important for:

```text
Settings / Admin
```

which requires:

```text
INVENTORY.ADMINISTER
```

---

### 5. Inventory workflow pages now soften nearby route links

Updated:

```text
invyra-platform/app/portal/inventory/[workflow]/page.tsx
```

The route itself remains hard-protected by:

```text
canAccessModule({ module: "INVENTORY", level: workflow.accessLevel })
```

The “Other Inventory Routes” section now labels restricted nearby routes instead of presenting them as available links.

---

### 6. Licensing page hardened with explicit licence permission guard

Updated:

```text
invyra-platform/app/portal/licensing/page.tsx
```

The Licensing page now explicitly requires:

```text
canAccessModule({ module: "LICENSING", level: "VIEW" })
```

The module sections also use the same shared visibility model as the portal home.

CRM and POS still do not show operational Open or Launch actions.

---

### 7. Legacy PortalShell mismatch fixed

Updated:

```text
invyra-platform/app/portal/admin/tenant-verification/page.tsx
```

This page previously used an older PortalShell prop pattern. It now uses the current protected PortalShell correctly with:

```text
getCurrentSession(...)
+
canAccessModule({ module: "ADMINISTRATION", level: "VIEW" })
+
<PortalShell session={session}>
```

---

### 8. Admin route guard alignment improved

Updated:

```text
invyra-platform/app/portal/admin/organisation/page.tsx
invyra-platform/app/portal/admin/onboarding/page.tsx
```

These pages now explicitly align with the platform permission visibility model instead of relying only on session existence.

---

### 9. UI polish added

Updated:

```text
invyra-platform/app/globals.css
```

Added styles for:

```text
- Sidebar restricted links
- Sidebar soft future / roadmap links
- Restricted status pill
- Licence-required visibility
- Disabled workflow route cards
- Environment access warning badge
```

---

### 10. Verification script added

Added:

```text
invyra-platform/scripts/verify-portal-phase1d.mjs
```

Package script added:

```bash
npm run verify:portal-phase1d
```

Result:

```text
Portal Phase 1D verification passed.
```

---

## Validation Performed

### Dependency-free verification

```bash
cd invyra-platform
node scripts/verify-portal-phase1d.mjs
```

Result:

```text
Portal Phase 1D verification passed.
```

### Syntax transpile check on edited TS / TSX files

Checked edited files with the TypeScript transpiler API.

Result:

```text
OK components/PortalShell.tsx
OK lib/portal/portal-access.ts
OK lib/portal/module-catalog.ts
OK app/portal/page.tsx
OK app/portal/inventory/page.tsx
OK app/portal/inventory/[workflow]/page.tsx
OK app/portal/licensing/page.tsx
OK app/portal/admin/tenant-verification/page.tsx
OK app/portal/admin/organisation/page.tsx
OK app/portal/admin/onboarding/page.tsx
```

### Full typecheck note

Full `tsc --noEmit` still cannot be completed inside the zip-only package because `node_modules` is not included. The known blocking errors are missing local dependencies such as Next, React, Prisma, Zod, and Node type packages.

Run after local install:

```bash
cd invyra-platform
npm install
npm run typecheck
npm run verify:portal-phase1d
```

---

## Acceptance Criteria Status

```text
✅ Sidebar Inventory links are role/licence aware
✅ Restricted workflows are labelled and not exposed as normal links
✅ Licence-required workflows direct users to Licensing
✅ Portal Home cards are permission-aware
✅ Inventory workflow cards show required access level
✅ Inventory workflow routes remain hard-protected
✅ Licensing page now has an explicit LICENSING.VIEW guard
✅ CRM and POS remain Coming Later / Future Module only
✅ No fake backend Inventory data was introduced
✅ No live customer stock data is implied
✅ Environment context remains visible
✅ Permission visibility avoids audit-log noise
```

---

## What This Phase Does Not Include

Not included yet:

```text
- Real Inventory backend data connection
- Items table implementation
- Movement ledger implementation
- Supplier CRUD
- Order workflow actions
- Receiving workflow actions
- Stocktake engine
- Report generation
- CRM portal implementation
- POS portal implementation
- Production billing/payment system
```

---

## Recommended Next Scope

```text
Phase 1E — Inventory Portal Workflow Detail Layouts
```

Recommended next move:

```text
Build the internal layout structure for each Inventory workflow route:
- Items
- Movements
- Suppliers
- Orders
- Receiving
- Wastage
- Store Use
- Reorder Review
- Gap Scan
- Stocktake
- Reports
- Training Mode
- Settings
```

Still front-end shell only, but each route should start looking like its eventual workflow page instead of using one generic detail template.
