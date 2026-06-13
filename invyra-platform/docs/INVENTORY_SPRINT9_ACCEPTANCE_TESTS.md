# Inventory Sprint 9 — Acceptance Tests

Status: LOCK READY

| Test | Expected Result | Status |
|---|---|---|
| Generate forecast run | ForecastRun row is created | PASS |
| ROP/ROQ recommendations | Low/out-of-stock items receive replenishment recommendations | PASS |
| Transfer optimization | Imbalanced locations receive transfer recommendation | PASS |
| New-store stocking | Baseline stocking recommendation is created | PASS |
| Supplier scoring | Supplier scorecards are created/updated | PASS |
| No stock mutation | Forecasting creates no InventoryMovement rows | PASS |
| Human review boundary | Recommendations remain OPEN/advisory | PASS |
| Audit logging | FORECAST_RUN_GENERATED action is logged | PASS |

Advisory Boundary: PASS
