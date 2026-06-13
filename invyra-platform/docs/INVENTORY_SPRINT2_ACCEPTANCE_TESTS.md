# Invyra Inventory Sprint 2 Acceptance Tests

## Opening Balances

- Create opening balance for an active item.
- Confirm stock balance is created.
- Confirm `OPENING_BALANCE` movement is created.
- Confirm before quantity is `0`.
- Confirm after quantity equals opening quantity.
- Block duplicate opening balance for the same item/location/environment.

## Adjustments

- Create positive manual adjustment.
- Create negative manual adjustment.
- Block adjustment with blank reason.
- Block adjustment that would create negative stock.
- Confirm `MANUAL_ADJUSTMENT` movement is created.
- Confirm before/after quantities are correct.

## Ledger Integrity

- Confirm stock balance is updated only through ledger posting service.
- Confirm movement records include item, location, delta, before, after, reason and user.
- Confirm historical movement rows are not editable through Sprint 2 APIs.
- Confirm no delete route exists for ledger movements.

## Security

- Staff cannot post opening balances.
- Supervisor cannot post direct adjustments.
- Manager can post opening balances and adjustments.
- Administrator can post opening balances and adjustments.
- Owner can post opening balances and adjustments.

## Environment Separation

- Opening balance created in TRAINING does not appear in LIVE.
- Adjustment created in TEST does not affect LIVE.
- Stock balances are organisation + environment scoped.

## Regression Protection

- Sprint 1 item/supplier writes remain available.
- Item/supplier writes still do not create stock movements.
- Purchase order, receiving, transfer, waste, consumption and stocktake writes remain disabled.
