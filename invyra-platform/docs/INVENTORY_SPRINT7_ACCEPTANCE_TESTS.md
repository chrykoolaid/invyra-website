# Invyra Inventory Sprint 7 Acceptance Tests

## Cost Centers
- PASS: cost center model exists
- PASS: cost center create/list API exists
- PASS: cost centers are organisation/environment scoped

## Consumption Templates
- PASS: template header and line models exist
- PASS: template create/list API exists
- PASS: templates support multiple inventory items and quantities

## Consumption Events
- PASS: consumption event and line models exist
- PASS: manual consumption API exists
- PASS: template execution API exists
- PASS: consumption dashboard API exists

## Ledger Integrity
- PASS: STORE_USE movement type is used for consumption
- PASS: quantityBefore and quantityAfter are recorded
- PASS: stock balance is updated through ledger service logic
- PASS: negative stock consumption is blocked

## Audit
- PASS: COST_CENTER_CREATED audit event exists
- PASS: CONSUMPTION_TEMPLATE_CREATED audit event exists
- PASS: MANUAL_CONSUMPTION_RECORDED audit event exists
- PASS: CONSUMPTION_TEMPLATE_EXECUTED audit event exists

## Boundaries
- PASS: no POS automation added
- PASS: no stocktake added
- PASS: no forecasting added
- PASS: consumption is separate from waste and sales
