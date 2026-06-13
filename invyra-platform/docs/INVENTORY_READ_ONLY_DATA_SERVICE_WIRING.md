# Inventory Read-only Data Service Wiring — Phase 2F

The Inventory API now has a controlled service layer between route handlers and Prisma.

## Service file

`lib/inventory/inventory-read-only-service.ts`

## Scope rule

Every query is scoped by:

```text
organisationId = current session organisation
environmentName = current session environment
```

This preserves tenant separation and LIVE / TRAINING / TEST separation.

## Query policy

Allowed in Phase 2F:

```text
count
findMany
select
orderBy
take
```

Not allowed in Phase 2F:

```text
create
createMany
update
updateMany
upsert
delete
deleteMany
raw SQL writes
CSV parsing
file uploads
stock mutation
```

## Endpoint behaviour

The API can now return actual database rows if they exist.

Empty collections are valid and expected before seeding/import activation.

## Record limit

Collection endpoints are capped at 100 rows until pagination is scoped.
