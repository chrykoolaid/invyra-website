# Inventory Read-only API Route Matrix — Phase 2C

| Route | Method | Permission | Data Source | Writes | Status |
|---|---:|---|---|---:|---|
| `/api/inventory/readiness` | GET | INVENTORY.VIEW | Session + contract metadata | No | Ready |
| `/api/inventory/items` | GET | INVENTORY.VIEW | Empty read-only contract | No | Ready |
| `/api/inventory/suppliers` | GET | INVENTORY.VIEW | Empty read-only contract | No | Ready |
| `/api/inventory/movements` | GET | INVENTORY.VIEW | Empty read-only contract | No | Ready |
| `/api/inventory/configuration` | GET | INVENTORY.ADMINISTER | Empty read-only contract | No | Ready |

## Notes

- All routes are tenant-scoped by the authenticated session.
- All routes expose the current environment in response metadata.
- All routes keep LIVE, TRAINING, and TEST separated by session context.
- Operational Inventory data connection is deferred until later phases.

## Endpoint Tokens

```text
GET /api/inventory/readiness
GET /api/inventory/items
GET /api/inventory/suppliers
GET /api/inventory/movements
GET /api/inventory/configuration
```
