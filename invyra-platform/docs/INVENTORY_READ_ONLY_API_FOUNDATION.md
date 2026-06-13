# Inventory Read-only API Foundation — Phase 2C

## Purpose

Phase 2C introduces the first protected Inventory API surface without connecting live operational Inventory tables.

The purpose is to make the portal/backend boundary testable before adding Prisma models, migrations, seed data, imports, or stock movement logic.

## Endpoints

```text
GET /api/inventory/readiness
GET /api/inventory/items
GET /api/inventory/suppliers
GET /api/inventory/movements
GET /api/inventory/configuration
```

## Access

```text
/api/inventory/readiness      INVENTORY.VIEW
/api/inventory/items          INVENTORY.VIEW
/api/inventory/suppliers      INVENTORY.VIEW
/api/inventory/movements      INVENTORY.VIEW
/api/inventory/configuration  INVENTORY.ADMINISTER
```

## Standard Response Contract

Collection routes return:

```json
{
  "ok": true,
  "data": {
    "meta": {
      "phase": "2C",
      "backendStatus": "read_only_contract_ready",
      "organisationId": "...",
      "environment": "LIVE",
      "liveDataConnected": false,
      "writeEnabled": false,
      "uploadsEnabled": false,
      "stockMutationEnabled": false
    },
    "records": [],
    "emptyState": {
      "title": "...",
      "description": "...",
      "nextSafeAction": "..."
    }
  }
}
```

## Deliberate Limitations

The routes do not query Inventory tables because the live Inventory Prisma models have not been activated yet.

The routes do not return sample data. Empty arrays are intentional.

The routes do not accept write methods. POST, PUT, PATCH, and DELETE are deliberately absent.
