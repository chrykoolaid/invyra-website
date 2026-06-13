# Sprint 5 Transfer Foundation Package

Implemented from Sprint 4 baseline.

## Added
- Location Master with location types
- Transfer request lifecycle
- Transfer approval
- Transfer dispatch with `TRANSFER_OUT`
- Transfer receipt with `TRANSFER_IN`
- In-transit inventory view
- Transfer lifecycle audit events
- Portal dashboard summary for locations/transfers

## Protection
- Transfers cannot use the same source and destination.
- Approval validates source availability.
- Dispatch blocks negative source stock.
- Approval does not mutate stock.
- Stock is moved only by immutable ledger entries.

## Still Deferred
- Waste
- Consumption
- Stocktakes
- Forecasting
- Imports
- POS integration
