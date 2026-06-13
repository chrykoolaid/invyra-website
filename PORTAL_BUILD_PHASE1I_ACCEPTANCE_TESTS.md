# Portal Build Phase 1I — Acceptance Tests

## Status

PASS after verification.

## Commands

```bash
cd invyra-platform
npm run verify:portal-phase1i
npm run verify:portal-phase1h
npm run verify:portal-phase1g
npm run verify:portal-phase1f
npm run verify:portal-phase1e
npm run verify:portal-phase1d
```

## Required Outcomes

```text
Portal Phase 1I verification passed.
Phase 1I route QA and runtime guard checks passed.
```

## Acceptance Criteria

```text
canAccessModule honours user permission overrides.
Inventory readiness route requires INVENTORY.VIEW.
Roadmap modules do not link into active Inventory workflow routes.
/portal/roadmap/[module] exists and is session-protected.
CRM and POS remain future-only and non-operational.
Future sidebar navigation is sourced from the shared module catalogue.
Known /portal hrefs resolve to real routes or controlled dynamic routes.
No uploads, forms, Prisma writes, or live stock mutation are added.
```
