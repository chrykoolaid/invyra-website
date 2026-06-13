# 🔒 INVYRA WEBSITE / PORTAL BUILD DEVELOPMENT PROGRAM v1

## Phase 1J — Inventory Portal Runtime Smoke Test Pack + Local Verification Guide

Status: COMPLETE

Baseline used:

```text
invyra_website_portal_phase1i_route_qa_runtime_guard_review_v1.zip
```

Output package:

```text
invyra_website_portal_phase1j_runtime_smoke_test_pack_v1.zip
```

---

## Objective

Phase 1J added a practical QA layer for the protected Inventory-first portal.

The goal was not to add new portal product features. The goal was to make the current portal shell easier to verify locally before deeper Inventory backend integration begins.

---

## Completed Work

### 1. Portal Runtime Smoke Script Added

Added:

```text
invyra-platform/scripts/portal-runtime-smoke.mjs
```

New command:

```bash
npm run smoke:portal
```

The smoke script checks:

```text
Logged-out portal redirect behaviour
Seed owner login
Protected /portal route loading
Protected /portal/inventory route loading
Inventory workflow route loading
Inventory readiness/setup/import/configuration route loading
Licensing route loading
CRM and POS future-only page loading
Roadmap page loading
Important content boundaries such as Inventory First, Not Connected, Coming Later, No Launch, and Roadmap Module
Optional staff smoke checks
```

The script writes:

```text
portal-runtime-smoke-results.json
```

---

### 2. Portal Smoke Results Review Script Added

Added:

```text
invyra-platform/scripts/portal-smoke-results-review.mjs
```

New command:

```bash
npm run review:portal-smoke-results
```

This reads real smoke output when present:

```text
portal-runtime-smoke-results.json
```

If real results are not present yet, it falls back to:

```text
invyra-platform/docs/PORTAL_PHASE1J_SMOKE_TEST_RESULTS_TEMPLATE.json
```

---

### 3. Smoke Manifest Added

Added:

```text
invyra-platform/docs/PORTAL_PHASE1J_SMOKE_TEST_MANIFEST.json
```

The manifest records:

```text
Default base URL
Environment variables
Logged-out redirect routes
Owner expected 200 routes
Content assertions
Non-goals
```

---

### 4. Local Verification Guide Added

Added:

```text
invyra-platform/docs/PORTAL_PHASE1J_LOCAL_VERIFICATION_GUIDE.md
```

The guide covers:

```text
npm install
.env preparation
Prisma generate/migrate/seed
static verification
local server startup
runtime smoke testing
smoke result review
manual browser route checks
known dependency/typecheck boundary
```

---

### 5. Dependency-Free Phase 1J Verification Added

Added:

```text
invyra-platform/scripts/verify-portal-phase1j.mjs
```

Updated:

```text
invyra-platform/package.json
```

New command:

```bash
npm run verify:portal-phase1j
```

This verifies the Phase 1J QA pack without requiring Next.js, React, Prisma, or installed `node_modules`.

---

### 6. Route Manifest Updated

Updated:

```text
invyra-platform/docs/ROUTE_PROTECTION_MANIFEST.md
```

Added a Phase 1J addendum documenting the new verification/smoke layer.

---

## Validation Result

Executed:

```bash
cd invyra-platform
npm run verify:portal-phase1j
npm run verify:portal-phase1i
npm run verify:portal-phase1h
npm run verify:portal-phase1g
npm run verify:portal-phase1f
npm run verify:portal-phase1e
npm run verify:portal-phase1d
node --check scripts/portal-runtime-smoke.mjs
node --check scripts/portal-smoke-results-review.mjs
node --check scripts/verify-portal-phase1j.mjs
```

Result:

```text
Portal Phase 1J verification passed.
Phase 1J runtime smoke pack and local guide checks passed.
Portal Phase 1I verification passed.
Portal Phase 1H verification passed.
Portal Phase 1G verification passed.
Portal Phase 1F verification passed.
Portal Phase 1E verification passed.
Portal Phase 1D verification passed.
```

---

## Important Boundary

Phase 1J does **not** add:

```text
Live Inventory backend integration
CSV upload handling
CSV parsing
Import preview
Database writes
Stock mutation
Supplier creation
Purchase order mutation
Receiving mutation
Report generation
CRM operational access
POS operational access
Payment processing
Billing
```

It only adds local runtime verification support for the protected Inventory-first portal shell.

---

## Recommended Next Scope

```text
Phase 1K — Portal Local Runtime Bug Fix Pass
```

This should be run after you test the Phase 1J build locally and provide screenshots or smoke-test output.
