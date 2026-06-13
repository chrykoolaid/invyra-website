# Inventory Backend Model Gap Register — Phase 2A

## Current Position

The current Prisma schema is a platform foundation schema. It does not yet include Inventory operational models.

This is acceptable for Phase 1, but Phase 2 backend implementation cannot safely proceed until these model gaps are contracted.

---

## Required Inventory Model Families

### 1. Item Master

Recommended future models:

```text
InventoryItem
InventoryItemBarcode
InventoryItemUnit
InventoryItemImageReference
```

Minimum requirements:

```text
organisationId
environment or explicit environment policy
sku/name/unit/status
createdBy/updatedBy where useful
audit linkage through AuditLog
```

### 2. Location and Stock Balance

Recommended future models:

```text
InventoryLocation
InventoryStockBalance
```

Minimum requirements:

```text
organisationId
environment
itemId
locationId
quantityOnHand
updatedAt
```

### 3. Movement Ledger

Recommended future models:

```text
InventoryMovement
InventoryMovementReference
```

Minimum requirements:

```text
organisationId
environment
itemId
locationId
movementType
quantityDelta
sourceType
sourceId
createdByUserId
createdAt
```

### 4. Suppliers and Supplier Mapping

Recommended future models:

```text
InventorySupplier
InventorySupplierItem
```

Minimum requirements:

```text
organisationId
supplier status
contact fields
supplier item code
pack size/min order quantity where relevant
```

### 5. Purchase Orders

Recommended future models:

```text
InventoryPurchaseOrder
InventoryPurchaseOrderLine
InventoryPurchaseOrderEvent
```

Minimum requirements:

```text
organisationId
environment
supplierId
status
draft/submit/approve/reject/amend lifecycle
line quantity/cost/unit fields
audit event mapping
```

### 6. Receiving and Discrepancies

Recommended future models:

```text
InventoryReceivingSession
InventoryReceivingLine
InventoryDiscrepancy
```

Minimum requirements:

```text
organisationId
environment
purchaseOrderId
received quantities
discrepancy reason/evidence
movement creation after confirmation
```

### 7. Wastage and Store Use

Recommended future models:

```text
InventoryWastageEvent
InventoryStoreUseEvent
```

Minimum requirements:

```text
organisationId
environment
itemId
quantity
reason/status
approval fields where required
movement link after posting
```

### 8. Reorder Review and Gap Scan

Recommended future models:

```text
InventoryReorderRule
InventoryReorderReviewRun
InventoryReorderReviewLine
InventoryGapScanRun
InventoryGapScanFinding
```

Minimum requirements:

```text
organisationId
environment
itemId
threshold/min/max/reorder settings
run metadata
finding status/explanation
```

### 9. Stocktake

Recommended future models:

```text
InventoryStocktakeSession
InventoryStocktakeLine
InventoryStocktakeApproval
```

Minimum requirements:

```text
organisationId
environment
session status
counted quantity
expected quantity snapshot
variance
approval/posting state
```

### 10. Imports

Recommended future models:

```text
InventoryImportBatch
InventoryImportRow
InventoryImportCommit
```

Minimum requirements:

```text
organisationId
environment
import type
source filename
preview status
row validation result
commit status
rollback evidence
```

### 11. Admin Configuration

Recommended future models:

```text
InventoryConfiguration
InventoryConfigurationEvent
```

Minimum requirements:

```text
organisationId
environment or global scope flag
key/value
updatedByUserId
audit event on change
```

---

## Phase 2B Contract Recommendation

Phase 2B should not create every model at once.

Recommended first model slice:

```text
InventoryItem
InventoryLocation
InventoryStockBalance
InventoryMovement
InventorySupplier
InventoryConfiguration
InventoryImportBatch
InventoryImportRow
```

Reason:

```text
This supports safe read-only portal wiring, setup readiness, item/supplier visibility, movement ledger preparation, and import preview planning without jumping into complex purchase order/receiving mutations.
```
