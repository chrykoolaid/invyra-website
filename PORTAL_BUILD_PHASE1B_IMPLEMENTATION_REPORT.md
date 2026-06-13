# 🔒 INVYRA WEBSITE / PORTAL BUILD DEVELOPMENT PROGRAM v1
# Phase 1B — Portal Shell Implementation Report

## Status

**Implementation status:** COMPLETE  
**Source baseline:** `invyra_website_wave7_inventory_first_alignment_v1.zip`  
**New package baseline:** `invyra_website_portal_phase1b_inventory_first_shell_v1.zip`

Phase 1B converts the protected Next.js platform portal from a broad platform-first portal into an Inventory-first customer portal shell.

---

## Implementation Summary

The protected portal now treats **Invyra Inventory** as the first available commercial product.

CRM and POS are no longer presented as active operational modules in the protected portal launcher or licensing view. They now route to controlled Future Module / Coming Later pages.

The implementation avoids fake backend claims. Inventory workflow cards are labelled as portal destinations prepared for later backend wiring unless the feature is only shell-level or environment/training related.

---

## Files Added

```text
invyra-platform/lib/portal/module-catalog.ts
invyra-platform/app/portal/inventory/page.tsx
invyra-platform/app/portal/crm/page.tsx
invyra-platform/app/portal/pos/page.tsx
```

---

## Files Edited

```text
invyra-platform/app/portal/page.tsx
invyra-platform/components/PortalShell.tsx
invyra-platform/app/portal/licensing/page.tsx
invyra-platform/app/portal/onboarding/page.tsx
invyra-platform/app/globals.css
invyra-platform/docs/ROUTE_PROTECTION_MANIFEST.md
app/portal.css
```

---

## Completed Scope

### 1. Shared Portal Module Catalogue

Added central module grouping for:

```text
Available First:
- Inventory

Platform Foundations:
- Licensing
- Users
- Organisations
- Devices
- Admin
- Audit
- Environment Settings

Future Modules:
- CRM
- POS
- Forecasting
- Purchasing Extensions
- Payroll
- Time Tracking
- Advanced Integrations
```

This reduces module-launcher drift across portal home, licensing, and future module pages.

---

### 2. Protected Portal Home Rebuilt

`/portal` now prioritises:

```text
Inventory-first customer portal
Available First: Inventory
Inventory Readiness Snapshot
Platform Foundations
Future Modules
Notifications
Recent Activity
Portal Readiness
```

CRM and POS no longer receive active Launch/Open behaviour from the protected portal home.

---

### 3. Protected Inventory Portal Route Added

New route:

```text
/portal/inventory
```

Access requirements:

```text
Authenticated session
+
canAccessModule({ module: "INVENTORY", level: "VIEW" })
```

The page includes portal entry cards for:

```text
Inventory Dashboard
Items
Inventory Movements
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
Settings / Admin
```

These are labelled as portal destinations / backend wiring next where appropriate.

---

### 4. CRM and POS Future Pages Added

New controlled routes:

```text
/portal/crm
/portal/pos
```

These routes prevent 404s but do not provide operational CRM or POS access.

They clearly state:

```text
Future Module
Coming Later
Inventory remains current priority
No Open / Launch access yet
```

---

### 5. PortalShell Navigation Reworked

The protected shell now groups navigation as:

```text
Inventory
Platform
Future
```

Inventory appears first with workflow-oriented links.

CRM and POS are labelled directly in navigation as:

```text
CRM · Coming Later
POS · Coming Later
```

---

### 6. Licensing Page Hardened

The licensing view now separates:

```text
Available First
Platform Foundations
Future Modules
```

CRM and POS are forced to Future Module / Coming Later behaviour regardless of seed/demo entitlement state. No CRM/POS Open button is shown.

---

### 7. Onboarding Copy Aligned

The onboarding module readiness table now treats:

```text
Inventory = active first product
CRM = future module
POS = future module
Forecasting = roadmap module
```

Removed old wording that implied CRM/POS could be launched from the portal home.

---

### 8. Layout Rule Reinforced

Updated static app portal CSS wrapper to avoid fixed narrow centering:

```text
max-width: none
margin: 0
width: 100%
```

Protected portal styling was also extended with Inventory-first, Future Module, Roadmap Module, and Platform Foundation states.

---

## Validation Performed

### Static File Checks

Passed:

```text
/portal/inventory route exists
/portal/crm route exists
/portal/pos route exists
Portal home contains Available First and Future Modules sections
Inventory route uses canAccessModule INVENTORY VIEW
PortalShell labels CRM and POS as Coming Later
Static app portal wrapper is no longer max-width centred
```

### Syntax Parse Check

Passed syntax checks using TypeScript `transpileModule` against:

```text
lib/portal/module-catalog.ts
app/portal/page.tsx
app/portal/inventory/page.tsx
app/portal/crm/page.tsx
app/portal/pos/page.tsx
app/portal/onboarding/page.tsx
components/PortalShell.tsx
app/portal/licensing/page.tsx
```

### Full Typecheck

Full `tsc --noEmit` could not be completed in this sandbox because `node_modules` are not present in the uploaded package. The failure was dependency-resolution related for Next.js, React, Prisma, Zod, bcryptjs, and Node type packages, not a completed runtime validation failure of the edited implementation.

---

## Deferred Items

Not included yet:

```text
Real Inventory backend data routes
Separate deep routes for Items, Orders, Receiving, etc.
Real customer stock data
Production auth changes
Billing/payment processing
CRM implementation
POS implementation
AI forecasting
Scanner/mobile app workflows
Founder / Support role modelling
Seed entitlement restructuring
```

Seed entitlement restructuring remains deferred because existing seeded-role verification scripts currently expect all enum modules to have entitlement records.

---

## Acceptance Status

Phase 1B acceptance criteria met:

```text
Inventory is first and primary portal destination.
Protected /portal/inventory exists.
CRM and POS do not show operational Open / Launch access.
CRM and POS routes do not 404.
Future modules are visually secondary.
Environment context is visible.
Organisation context is visible.
Role context is visible.
Licence context is visible.
Access denied behaviour remains intact for Inventory route.
No fake backend claims introduced.
No live customer data implied.
Portal layout remains calm and full-width aligned.
```

---

## Recommended Next Scope

Proceed next to:

```text
Phase 1C — Inventory Portal Workflow Route Skeletons
```

Recommended next build targets:

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
/portal/inventory/training
/portal/inventory/settings
```

Each route should remain shell-first and clearly labelled until backend connection is explicitly scoped.
