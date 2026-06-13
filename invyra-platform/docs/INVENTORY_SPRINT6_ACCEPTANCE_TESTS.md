# Inventory Sprint 6 — Acceptance Tests

Status: LOCK READY

| Test | Expected Result | Status |
|---|---|---|
| Waste event created with valid stock | WASTAGE movement reduces stock | PASS |
| Damage event with disposition | Loss event records disposition and value | PASS |
| Expiry event with expiry date | Loss event stores expiry evidence | PASS |
| Shrinkage event | SHRINKAGE movement reduces stock | PASS |
| Markdown event | Markdown record created with replacement barcode field | PASS |
| Negative stock attempt | Request is blocked | PASS |
| Environment isolation | Event cannot use item/location from another environment | PASS |
| Audit logging | Inventory loss/markdown action is audit logged | PASS |

Ledger Integrity: PASS
