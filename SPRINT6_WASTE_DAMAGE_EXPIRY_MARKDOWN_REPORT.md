# 🔒 INVYRA INVENTORY SPRINT 6 — WASTE, DAMAGE, EXPIRY & MARKDOWN ENGINE

Status: IMPLEMENTED / PACKAGE READY

Baseline: `invyra_inventory_sprint5_multilocation_transfers_v1.zip`

Output: `invyra_inventory_sprint6_waste_damage_expiry_markdown_v1.zip`

## Implemented Scope

Sprint 6 adds the Inventory Loss Management subsystem while preserving ledger integrity.

### Added

- Inventory loss event model
- Markdown event model
- Waste / damage / expiry / shrinkage classification
- Markdown label architecture: reduced price + replacement barcode
- Markdown monitor sheet page
- Loss dashboard service
- Loss event API
- Markdown API
- Loss dashboard API
- Portal page: `/portal/inventory/loss-management`
- Migration: `20260613130000_inventory_sprint6_loss_markdown`

## Ledger Rules

Stock loss must not be a direct stock edit.

Allowed ledger-controlled reductions:

- WASTAGE
- DAMAGE using WASTAGE movement
- EXPIRY using WASTAGE movement
- SHRINKAGE using SHRINKAGE movement

Markdowns do not reduce stock by themselves. They track price recovery and replacement barcode label details.

## Locked Safety Rules

- Expired items remain POS-blocked even if a markdown label exists.
- Loss events require reason and audit metadata.
- Loss movements cannot create negative stock.
- Markdown price must be lower than original price.
- LIVE / TRAINING / TEST remain scoped by organisation and environment.

## API Surface

- `GET /api/inventory/loss-events`
- `POST /api/inventory/loss-events`
- `GET /api/inventory/markdowns`
- `POST /api/inventory/markdowns`
- `GET /api/inventory/loss-dashboard`

## Not Enabled Yet

- POS sale blocking runtime integration
- Handheld printer integration
- Image/file upload for damage evidence
- Supplier credit note processing
- Automated markdown recommendation AI
- PDF export

These remain future hardening items.

## Acceptance Status

- Waste event structure: PASS
- Damage disposition structure: PASS
- Expiry metadata structure: PASS
- Markdown monitor structure: PASS
- Markdown replacement barcode architecture: PASS
- Ledger-only loss mutation rule: PASS
- Direct stock edit avoided: PASS
- Environment scoping preserved: PASS

## Next Sprint

Sprint 7 — Consumption, Cost Centers & Internal Usage Intelligence.
