# 🔒 PORTAL BUILD PHASE 1L — ACCEPTANCE TESTS

## Scope

Phase 1L is accepted when the project has a repeatable way to review real local runtime smoke-test results.

## Required Checks

```text
[ ] Runtime results report generator exists
[ ] npm run review:portal-runtime-results exists
[ ] Phase 1L guide exists
[ ] Phase 1L checklist exists
[ ] Phase 1L manual template exists
[ ] Initial Phase 1L NOT RUN review report exists
[ ] Phase 1L verifier exists
[ ] npm run verify:portal-phase1l exists
[ ] Report generator supports real smoke results
[ ] Report generator supports template/not-run state
[ ] Report generator classifies failed checks
[ ] Report generator writes docs/PORTAL_PHASE1L_LOCAL_RUNTIME_RESULTS_REVIEW.md
[ ] Route manifest includes Phase 1L addendum
[ ] Phase 1K through Phase 1D verification still passes
```

## Command Validation

Run:

```bash
cd invyra-platform
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

Expected result:

```text
Portal Phase 1L verification passed.
Phase 1L runtime results review checks passed.
```

## Runtime Review Command

After local server and smoke tests:

```bash
npm run smoke:portal
npm run review:portal-runtime-results
```

Expected output file:

```text
docs/PORTAL_PHASE1L_LOCAL_RUNTIME_RESULTS_REVIEW.md
```

## Non-goals

Phase 1L must not introduce:

```text
Uploads
CSV parsing
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
