# Inventory Read-only API Contract — Phase 2B

## Status

CONTRACTED / NOT IMPLEMENTED

Phase 2B defines the shape for Phase 2C read-only APIs. It does not create API routes.

All future endpoints must use:

```text
requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" })
```

Configuration admin reads may use:

```text
requirePlatformAccess({ request, module: "INVENTORY", level: "ADMINISTER" })
```

---

## GET /api/inventory/readiness

Purpose:

```text
Return readiness status for Inventory setup in the current organisation and environment.
```

Response shape:

```json
{
  "ok": true,
  "data": {
    "organisationId": "from-session",
    "environmentName": "LIVE",
    "inventoryLicenceActive": true,
    "hasLocations": false,
    "hasItems": false,
    "hasSuppliers": false,
    "hasConfiguration": false,
    "backendConnected": true,
    "writeActionsEnabled": false
  }
}
```

---

## GET /api/inventory/items

Purpose:

```text
Return environment-scoped Inventory item master records.
```

Empty response shape:

```json
{
  "ok": true,
  "data": {
    "items": [],
    "total": 0,
    "environmentName": "LIVE"
  }
}
```

---

## GET /api/inventory/suppliers

Purpose:

```text
Return environment-scoped supplier records.
```

Empty response shape:

```json
{
  "ok": true,
  "data": {
    "suppliers": [],
    "total": 0,
    "environmentName": "LIVE"
  }
}
```

---

## GET /api/inventory/movements

Purpose:

```text
Return environment-scoped immutable Inventory movement records.
```

Empty response shape:

```json
{
  "ok": true,
  "data": {
    "movements": [],
    "total": 0,
    "environmentName": "LIVE"
  }
}
```

---

## GET /api/inventory/configuration

Purpose:

```text
Return environment-scoped Inventory configuration snapshot.
```

Empty/default response shape:

```json
{
  "ok": true,
  "data": {
    "configuration": null,
    "defaultsApplied": true,
    "environmentName": "LIVE",
    "writeActionsEnabled": false
  }
}
```

---

## Error Response Contract

Denied access should use the existing platform API response pattern and include safe error codes such as:

```text
UNAUTHENTICATED
ORGANISATION_REQUIRED
ENVIRONMENT_NOT_ALLOWED
LICENSE_ENTITLEMENT_MISSING
ROLE_PERMISSION_MISSING
USER_PERMISSION_OVERRIDE_DENIED
```

Do not leak cross-tenant record existence in error messages.
