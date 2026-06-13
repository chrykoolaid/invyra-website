# Inventory Read-only Demo Seed Pack — Phase 2I

## Status

Phase 2I adds a controlled local demo seed pack for validating the Inventory read-only portal and API surfaces.

This seed pack is intentionally limited to demo validation rows. It does not enable operational customer use.

## Command

```bash
npm run db:seed
npm run seed:inventory-readonly-demo
```

`npm run db:seed` creates the platform demo organisation, users, roles, permissions, licences, and environments.

`npm run seed:inventory-readonly-demo` adds Inventory demo rows for the existing demo organisation.

## Seed Scope

The seed pack creates demo rows for:

- Inventory locations
- Inventory items
- Inventory suppliers
- Inventory stock balances
- Inventory movements
- Inventory configuration

Seeded environments:

- LIVE
- TRAINING
- TEST

The rows are scoped by:

- organisationId
- environmentName

## Demo Organisation

Default organisation:

```text
invyra_demo_organisation
```

Override with:

```bash
INVYRA_DEMO_ORGANISATION_ID=<organisation-id> npm run seed:inventory-readonly-demo
```

## Boundary

Phase 2I does not enable:

- item creation from the portal
- supplier creation from the portal
- imports
- upload processing
- purchase order submission
- receiving confirmation
- stock mutation
- scanner posting
- CRM access
- POS access

The seed script itself writes local demo rows to the database, but the protected portal and API remain read-only.

## Purpose

This gives local QA a predictable dataset so the following read-only surfaces can be visually tested:

- Inventory dashboard counts
- Items preview table
- Suppliers preview table
- Movements preview table
- Configuration preview table
- Readiness counts
- Environment separation

## Data Governance

The demo rows use deterministic IDs and upserts where possible so the command can be re-run safely in local development.

These rows are not production data and should not be used to represent a customer implementation.
