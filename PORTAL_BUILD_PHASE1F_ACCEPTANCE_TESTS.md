# Portal Build Phase 1F — Acceptance Tests

## Scope

Inventory Portal Empty States + Onboarding Readiness Flow.

## Required checks

1. `/portal/inventory/readiness` exists and renders a customer-safe Inventory setup flow.
2. Portal Home contains an Inventory Readiness action and readiness summary.
3. Inventory Dashboard contains an Inventory Onboarding Readiness card.
4. Inventory Dashboard contains an Empty State Principles card.
5. Workflow detail pages include a guided empty-state action to check Inventory readiness.
6. Workflow detail pages clearly say backend connection is deferred.
7. First Login / Onboarding contains an Inventory Readiness Flow panel.
8. First Login / Onboarding contains an Inventory Empty State Policy panel.
9. Sidebar Inventory navigation includes Readiness.
10. No fake item, supplier, order, receiving, movement, stocktake, report, or scan rows are introduced.
11. CRM and POS remain future-only.
12. Route manifest includes the Phase 1F readiness route and empty-state governance rules.

## Command

```bash
cd invyra-platform
npm run verify:portal-phase1f
```

## Expected result

```text
Portal Phase 1F verification passed.
Phase 1F static implementation checks passed.
```
