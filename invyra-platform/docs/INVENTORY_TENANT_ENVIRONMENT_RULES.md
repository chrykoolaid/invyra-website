# Inventory Tenant + Environment Separation Rules — Phase 2B

## Status

LOCKED CONTRACT / NOT MIGRATED

## Required Scope Fields

Every Inventory operational table must include:

```text
organisationId
environmentName
```

The following fields are required where operationally relevant:

```text
locationId
itemId
createdByUserId
updatedByUserId
deviceId
createdAt
updatedAt
```

## Organisation Rule

A user may only access Inventory records where:

```text
record.organisationId === session.organisationId
```

No Inventory query should be allowed without an organisation filter.

## Environment Rule

A user may only access Inventory records where:

```text
record.environmentName === session.environmentName
```

No Inventory query should be allowed without an environment filter.

## LIVE / TRAINING / TEST Hard Boundary

```text
LIVE stock cannot be visible in TRAINING.
TRAINING stock cannot be visible in LIVE.
TEST stock cannot be visible in LIVE or TRAINING.
```

This applies to:

```text
Stock balances
Movement ledger
Opening balance movements
Supplier setup
Orders
Receiving
Wastage
Store use
Reorder rules
Gap scan runs
Stocktake sessions
Import batches
Configuration snapshots
Reports
```

## Unique Index Pattern

Inventory unique indexes must include both tenant and environment fields.

Examples:

```text
@@unique([organisationId, environmentName, sku])
@@unique([organisationId, environmentName, supplierCode])
@@unique([organisationId, environmentName, locationId, itemId])
```

## Query Guard Pattern

Future Inventory services should require a scope object similar to:

```text
{
  organisationId,
  environmentName,
  userId,
  role,
  permissionLevel
}
```

The service layer should not accept organisation or environment from browser-submitted request bodies for scoped reads/writes. These must come from the authenticated session context.

## Audit Scope Rule

Every audited Inventory action must record:

```text
module: INVENTORY
environmentName
organisationId
userId
action
resourceType
resourceId where available
```
