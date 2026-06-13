# Invyra Inventory Sprint 3 Acceptance Tests

## Procurement
- PASS: Purchase order route files exist.
- PASS: Purchase order service exists.
- PASS: Draft creation validates supplier and item environment scope.
- PASS: Draft creation records lines.
- PASS: Draft editing is blocked after submission.
- PASS: Submit transition supports DRAFT → SUBMITTED.
- PASS: Approve transition supports SUBMITTED → APPROVED.
- PASS: Send transition supports APPROVED → SENT.
- PASS: Cancel transition is available before receiving.

## Stock Safety
- PASS: Procurement service does not create `InventoryMovement` records.
- PASS: Procurement service does not update `InventoryStockBalance`.
- PASS: API responses explicitly mark `stockMutationEnabled: false`.

## Audit
- PASS: PO lifecycle audit events are defined.

## Environment
- PASS: All queries use organisation + environment scope.

## Deferred
- Receiving status changes are deferred to Sprint 4.
- Reorder Review draft PO generation is deferred until replenishment workbench implementation.
