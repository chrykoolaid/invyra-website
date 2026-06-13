# 🔒 INVYRA WEBSITE / PORTAL BUILD DEVELOPMENT PROGRAM v1
# Phase 1M — Final Lock Acceptance Tests

## Status

PASS when `npm run verify:portal-phase1m` succeeds.

## Acceptance Criteria

Phase 1M is accepted only when all checks below are true.

### 1. Final lock documents exist

Required files:

```text
PORTAL_BUILD_PHASE1M_FINAL_LOCK_REPORT.md
PORTAL_BUILD_PHASE1M_ACCEPTANCE_TESTS.md
invyra-platform/docs/PORTAL_BUILD_PHASE1M_FINAL_LOCK_REPORT.md
invyra-platform/docs/PORTAL_BUILD_PHASE1M_ACCEPTANCE_TESTS.md
invyra-platform/docs/PORTAL_PHASE1_FINAL_LOCK_MANIFEST.json
invyra-platform/scripts/verify-portal-phase1m.mjs
```

### 2. Phase chain remains intact

The package must still include implementation and acceptance documents from Phase 1B through Phase 1L where applicable.

### 3. Inventory-first position remains locked

The final lock report must explicitly preserve:

```text
Available First: Inventory
CRM/POS as Future Module / Coming Later
Future roadmap modules as roadmap-only
```

### 4. Active route boundaries remain clear

The final lock report must separate:

```text
Active Inventory-first routes
Platform foundation routes
Future-only routes
```

### 5. Backend boundary remains explicit

The final lock report must state that Phase 1 does not add:

```text
Uploads
CSV parsing
Prisma writes
Stock mutation
Supplier creation
Purchase order submission
Receiving confirmation
CRM operational portal
POS operational portal
```

### 6. Verification chain remains runnable

The package must expose:

```text
npm run verify:portal-phase1m
npm run verify:portal-phase1l
npm run verify:portal-phase1k
npm run verify:portal-phase1j
npm run verify:portal-phase1i
npm run verify:portal-phase1h
npm run verify:portal-phase1g
npm run verify:portal-phase1f
npm run verify:portal-phase1e
npm run verify:portal-phase1d
```

### 7. Runtime smoke path remains documented

The final lock report must keep the correct local runtime sequence:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
npm run smoke:portal
npm run review:portal-runtime-results
```

## Final Decision Rule

If all Phase 1M checks pass, the portal is lock-ready as:

```text
Inventory-first protected portal shell baseline
```

It is not yet accepted as:

```text
Live Inventory backend portal
```
