# Portal Build Phase 2C Acceptance Tests

Phase 2C is accepted only when all of the following are true.

## Required Files

- `lib/inventory/inventory-read-only-api.ts` exists.
- `/app/api/inventory/readiness/route.ts` exists.
- `/app/api/inventory/items/route.ts` exists.
- `/app/api/inventory/suppliers/route.ts` exists.
- `/app/api/inventory/movements/route.ts` exists.
- `/app/api/inventory/configuration/route.ts` exists.
- `docs/PORTAL_PHASE2C_READ_ONLY_API_MANIFEST.json` exists.

## Guard Rules

- Every Phase 2C API route must use `requirePlatformAccess`.
- Readiness, Items, Suppliers, and Movements must require `INVENTORY.VIEW`.
- Configuration must require `INVENTORY.ADMINISTER`.

## Response Rules

- Every route must return structured JSON through `ok(...)`.
- Response metadata must include organisation id and environment.
- Response metadata must explicitly state:
  - `liveDataConnected: false`
  - `writeEnabled: false`
  - `uploadsEnabled: false`
  - `stockMutationEnabled: false`
- Collection responses must return `records: []`.

## Boundary Rules

- No live Inventory Prisma models are added to `prisma/schema.prisma`.
- No migrations are added.
- No Inventory API route may export POST, PUT, PATCH, or DELETE.
- No route may call `prisma.inventory...` models.
- No upload parser is added.
- No CSV parser is added.
- No stock mutation is added.
- CRM and POS remain Future Module / Coming Later only.
