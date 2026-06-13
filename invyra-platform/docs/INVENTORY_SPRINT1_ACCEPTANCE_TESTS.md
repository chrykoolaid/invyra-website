# Invyra Inventory Sprint 1 Acceptance Tests

## Item Master

- Create item with SKU, name and unit.
- Block missing SKU.
- Block missing name.
- Block missing unit.
- Block duplicate SKU in same organisation/environment.
- Block duplicate barcode in same organisation/environment when barcode is provided.
- Edit item fields.
- Archive item as Administrator/Owner.
- Restore item as Administrator/Owner.
- Confirm item created in TRAINING does not appear in LIVE.

## Supplier Master

- Create supplier with name.
- Block missing supplier name.
- Edit supplier fields.
- Archive supplier as Administrator/Owner.
- Restore supplier as Administrator/Owner.
- Confirm supplier created in TRAINING does not appear in LIVE.

## Security

- Staff can view only.
- Supervisor can view only.
- Manager can create/edit.
- Manager cannot archive/restore.
- Administrator can create/edit/archive/restore.
- Owner can create/edit/archive/restore.

## Audit

- ITEM_CREATED recorded.
- ITEM_UPDATED recorded.
- ITEM_ARCHIVED recorded.
- ITEM_RESTORED recorded.
- SUPPLIER_CREATED recorded.
- SUPPLIER_UPDATED recorded.
- SUPPLIER_ARCHIVED recorded.
- SUPPLIER_RESTORED recorded.

## Stock Protection

- Item master writes create no InventoryMovement entries.
- Supplier master writes create no InventoryMovement entries.
- No receiving, PO or stock adjustment route is activated by Sprint 1.
