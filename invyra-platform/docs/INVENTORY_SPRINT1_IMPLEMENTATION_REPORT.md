# Invyra Inventory Implementation Program — Sprint 1 Report

## Status

IMPLEMENTED AS FIRST CONSTRUCTION PACKAGE.

## Baseline

`invyra_website_portal_phase2k_read_only_demo_portal_ux_qa_v1.zip`

## Sprint Objective

Move the portal from read-only demo inventory data to operational Inventory master-data writes without enabling stock mutation.

## Implemented

### Item Master

- `POST /api/inventory/items`
- `PUT /api/inventory/items/:id`
- `DELETE /api/inventory/items/:id`
- `POST /api/inventory/items/:id/restore`
- `/portal/inventory/items` UI page

Supported fields:

- SKU
- Barcode
- Name
- Description
- Category
- Brand
- Unit
- Status
- Archive metadata

### Supplier Master

- `POST /api/inventory/suppliers`
- `PUT /api/inventory/suppliers/:id`
- `DELETE /api/inventory/suppliers/:id`
- `POST /api/inventory/suppliers/:id/restore`
- `/portal/inventory/suppliers` UI page

Supported fields:

- Supplier Code
- Name
- Contact
- Phone
- Email
- Address
- Notes
- Status
- Archive metadata

### Governance

- Manager, Administrator and Owner can create/edit where permissions allow.
- Administrator and Owner can archive/restore where ADMINISTER permission allows.
- Staff and Supervisor remain read-only.
- LIVE/TRAINING/TEST scoping is preserved through organisation + environment queries.
- Item and supplier writes do not create stock movements.
- Archive/restore is soft-delete only.
- Audit actions are recorded for create/update/archive/restore.

## Explicitly Not Enabled

- No stock mutation.
- No purchase orders.
- No receiving.
- No stock adjustments.
- No CSV imports.
- No uploads.
- No ledger writes.

## Migration Added

`prisma/migrations/20260613090000_inventory_sprint1_master_data/migration.sql`

Adds Sprint 1 fields for item/supplier master data and enforces barcode uniqueness when barcode exists.

## Lock Decision

Sprint 1 is ready for local runtime verification.
