# Portal Build Phase 1J — Acceptance Tests

## Status

PASS after dependency-free verification.

## Static Verification Commands

```bash
cd invyra-platform
npm run verify:portal-phase1j
npm run verify:portal-phase1i
npm run verify:portal-phase1h
npm run verify:portal-phase1g
npm run verify:portal-phase1f
npm run verify:portal-phase1e
npm run verify:portal-phase1d
```

## Runtime Smoke Commands

Run after `npm install`, Prisma setup, seed, and `npm run dev`:

```bash
npm run smoke:portal
npm run review:portal-smoke-results
```

## Required Static Outcomes

```text
Portal Phase 1J verification passed.
Phase 1J runtime smoke pack and local guide checks passed.
```

## Required Runtime Outcomes

```text
Logged-out portal routes redirect to login.
Seed owner can log in.
Seed owner can open the protected Inventory portal routes.
Inventory workflow routes return 200 for an owner/admin context.
Inventory admin configuration is protected.
CRM and POS remain Future Module / Coming Later / No Launch.
Roadmap modules remain roadmap-only and non-operational.
Smoke results are written to portal-runtime-smoke-results.json.
Smoke results review can read and summarize the results.
```

## Acceptance Criteria

```text
A portal runtime smoke script exists.
A portal smoke results review script exists.
A smoke manifest exists.
A local verification guide exists.
Package scripts expose verify:portal-phase1j, smoke:portal, and review:portal-smoke-results.
Static Phase 1J verification passes without node_modules.
Phase 1I through Phase 1D portal verification still passes.
No uploads, CSV parsing, Prisma writes, or live Inventory backend mutation are added.
No CRM or POS operational Open / Launch path is added.
No fake stock, supplier, order, receiving, report, or scan data is introduced.
```
