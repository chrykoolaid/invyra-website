# Invyra Inventory Sprint 7 Implementation Report

## Sprint
Sprint 7 — Consumption, Cost Centers & Internal Usage Intelligence

## Status
LOCK READY

## Implemented
- Cost Center data model
- Consumption Template data model
- Consumption Template Lines
- Consumption Event records
- Consumption Event Lines
- STORE_USE ledger-backed stock reduction
- Manual consumption API
- Template-based consumption API
- Consumption dashboard API
- Portal dashboard consumption snapshot
- Consumption client UI section
- Audit events for cost centers, templates, manual consumption, and template execution

## Governance
- Internal usage is not treated as sale or waste.
- Consumption reduces stock only through immutable STORE_USE ledger movements.
- Negative stock consumption is blocked.
- Cost centers and templates are scoped by organisation and environment.
- LIVE, TRAINING, and TEST separation remains enforced through organisationId + environmentName scoping.

## APIs Added
- GET/POST /api/inventory/cost-centers
- GET/POST /api/inventory/consumption-templates
- GET/POST /api/inventory/consumption-events
- GET /api/inventory/consumption-dashboard

## Not Included Yet
- POS service recipe automation
- Refund/void inventory logic
- Stocktake sessions
- Forecasting
- AI recommendations

## Next Sprint
Sprint 8 — Stocktakes, Cycle Counting & Inventory Accuracy
