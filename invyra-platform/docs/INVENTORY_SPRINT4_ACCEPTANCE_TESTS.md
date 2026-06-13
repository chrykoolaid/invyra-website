# Invyra Inventory Sprint 4 Acceptance Tests

## Receiving
- PASS: Approved/Sent/Partially Received POs are receivable.
- PASS: Draft/Cancelled/Closed POs are not receivable.
- PASS: Full receipt creates RECEIVING ledger movement.
- PASS: Partial receipt creates RECEIVING ledger movement and leaves PO partially received.
- PASS: Final receipt marks PO received.

## Discrepancies
- PASS: Discrepancy reason can be captured per line.
- PASS: Receipt with discrepancy is marked DISCREPANCY_REPORTED.
- PASS: Over-delivery requires Manager, Administrator or Owner.

## Ledger Integrity
- PASS: Quantity before and after are recorded.
- PASS: StockBalance is updated from receiving movement.
- PASS: PO creation/approval/sending still produces no stock movement.

## Audit
- PASS: RECEIPT_CREATED or RECEIPT_WITH_DISCREPANCY_CREATED audit event is recorded.

## Environment
- PASS: All receiving queries and writes are organisation/environment scoped.
