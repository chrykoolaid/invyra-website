# Invyra Inventory Sprint 5 Acceptance Tests

## Locations

- Create location succeeds for authorised Manager+ users.
- Location code is unique by organisation and environment.
- Location list is scoped to organisation and environment.
- Location archive is blocked while stock exists.

## Transfers

- Create transfer request succeeds.
- Source and destination cannot be the same location.
- Transfer approval validates source stock availability.
- Approval does not create ledger movement.
- Dispatch creates `TRANSFER_OUT` movement.
- Receive creates `TRANSFER_IN` movement.
- Partial receipt leaves transfer in `PARTIALLY_RECEIVED`.
- Full receipt moves transfer to `RECEIVED`.
- Cancellation is blocked once transfer is in transit.

## Conservation

- Total stock equals source stock + destination stock + derived in-transit stock during transit.
- No transfer flow creates stock without a matching transfer-out event.

## Security

- Staff/Supervisor may create transfer requests.
- Manager/Administrator/Owner may approve transfers.
- Environment and organisation scope is enforced on every transfer route.

## Audit

- `LOCATION_CREATED`
- `LOCATION_ARCHIVED`
- `TRANSFER_CREATED`
- `TRANSFER_SUBMITTED`
- `TRANSFER_APPROVED`
- `TRANSFER_DISPATCHED`
- `TRANSFER_RECEIVED`
- `TRANSFER_CANCELLED`
