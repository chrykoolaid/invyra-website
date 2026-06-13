# Inventory Seed Activation Plan

## Purpose

Define safe seed behaviour after Inventory Prisma models are activated.

## First Seed Rule

Do not seed fake operational Inventory data.

The first seed phase may create only minimal setup scaffolding if required, such as:

- default Inventory configuration rows for DEMO organisation
- TEST/TRAINING configuration defaults
- no LIVE stock quantities unless manually created by authorised setup flow

## Explicitly Prohibited

- fake LIVE items with stock balances
- fake suppliers presented as real vendors
- fake purchase orders
- fake receiving records
- fake wastage records
- fake stocktake results
- fake movement history

## Recommended First Seed Scope

For development/demo only:

```text
InventoryConfiguration defaults by organisation/environment
No InventoryItem rows
No InventoryStockBalance rows
No InventoryMovement rows
```

## Environment Seed Rule

Training and test data may be seeded only if visibly labelled and technically scoped to TRAINING or TEST.

LIVE seed data must remain empty unless manually created by a safe onboarding process.
