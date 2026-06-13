# 🔒 INVYRA PORTAL PHASE 1L — LOCAL RUNTIME RESULTS REVIEW GUIDE

## Purpose

Phase 1L reviews the real local runtime smoke-test output from the Inventory-first protected portal.

It does not add portal product features. It gives us a controlled way to decide whether the portal shell is ready to lock before backend Inventory integration begins.

## Required Order

Run from:

```bash
cd invyra-platform
```

Recommended sequence:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

In a second terminal:

```bash
cd invyra-platform
npm run smoke:portal
npm run review:portal-smoke-results
npm run review:portal-runtime-results
```

## Expected Files

After smoke testing, the runtime smoke script should create:

```text
portal-runtime-smoke-results.json
```

The Phase 1L report generator creates:

```text
docs/PORTAL_PHASE1L_LOCAL_RUNTIME_RESULTS_REVIEW.md
```

If the smoke results file does not exist yet, the Phase 1L report generator will create a NOT RUN report from the Phase 1J template.

## How To Read The Result

```text
PASS
All available runtime smoke checks passed. The portal shell can be considered lock-ready for this QA stage.

NOT RUN
No real runtime smoke results were available. Do not lock runtime readiness yet.

FAIL
One or more smoke checks failed. Fix the issue before moving into Inventory backend integration.
```

## Common Failure Categories

```text
Authentication or seed account
Missing route / route registration
Runtime render/server error
Permission or entitlement guard
Unexpected login redirect/session state
Visible page copy/content assertion
Inventory admin route/permission
Future module route boundary
Inventory portal route
```

## Boundary Rules

Phase 1L must not introduce:

```text
Uploads
CSV parser
Import preview
Prisma writes
Stock mutation
Supplier creation
Purchase order mutation
Receiving mutation
CRM operational launch
POS operational launch
Billing/payment processing
```
