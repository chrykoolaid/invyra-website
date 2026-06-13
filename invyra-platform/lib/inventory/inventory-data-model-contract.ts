/**
 * Invyra Inventory Data Model Contract — Phase 2B
 *
 * Contract-only file. This does not create Prisma tables, API routes,
 * database writes, uploads, parsers, or operational Inventory mutations.
 */

export const INVENTORY_DATA_MODEL_CONTRACT_PHASE = "2B" as const;

export const inventoryEnvironmentNames = ["LIVE", "TRAINING", "TEST"] as const;
export type InventoryEnvironmentName = (typeof inventoryEnvironmentNames)[number];

export const inventoryPermissionLevels = ["VIEW", "CREATE", "EDIT", "APPROVE", "ADMINISTER"] as const;
export type InventoryPermissionLevel = (typeof inventoryPermissionLevels)[number];

export const inventoryDataModelFamilies = [
  "location",
  "item_master",
  "stock_balance",
  "movement_ledger",
  "supplier",
  "supplier_item_mapping",
  "purchase_order",
  "receiving",
  "discrepancy",
  "wastage",
  "store_use",
  "reorder_rule",
  "gap_scan",
  "stocktake",
  "import_batch",
  "configuration"
] as const;

export type InventoryDataModelFamily = (typeof inventoryDataModelFamilies)[number];

export type InventoryModelStatus =
  | "contracted"
  | "prisma_draft_only"
  | "deferred_until_write_phase";

export type InventoryMutationBoundary =
  | "read_only_phase"
  | "setup_write_phase"
  | "import_preview_phase"
  | "import_commit_phase"
  | "operational_write_phase";

export interface InventoryTenantEnvironmentScopeContract {
  organisationId: string;
  environmentName: InventoryEnvironmentName;
  locationId?: string;
  createdByUserId?: string;
  updatedByUserId?: string;
  deviceId?: string;
}

export interface InventoryModelContractEntry {
  modelName: string;
  family: InventoryDataModelFamily;
  status: InventoryModelStatus;
  firstAllowedPhase: "2C" | "2D" | "2E" | "2F" | "2G" | "2H";
  requiredPermission: InventoryPermissionLevel;
  mutationBoundary: InventoryMutationBoundary;
  tenantScoped: true;
  environmentScoped: true;
  auditRequired: boolean;
  purpose: string;
}

export const inventoryModelContract: InventoryModelContractEntry[] = [
  {
    modelName: "InventoryLocation",
    family: "location",
    status: "contracted",
    firstAllowedPhase: "2C",
    requiredPermission: "VIEW",
    mutationBoundary: "read_only_phase",
    tenantScoped: true,
    environmentScoped: true,
    auditRequired: true,
    purpose: "Defines operational stock locations without merging LIVE, TRAINING, or TEST inventory."
  },
  {
    modelName: "InventoryItem",
    family: "item_master",
    status: "contracted",
    firstAllowedPhase: "2C",
    requiredPermission: "VIEW",
    mutationBoundary: "read_only_phase",
    tenantScoped: true,
    environmentScoped: true,
    auditRequired: true,
    purpose: "Defines the item master used by stock balances, movements, supplier mappings, orders, and reports."
  },
  {
    modelName: "InventoryStockBalance",
    family: "stock_balance",
    status: "contracted",
    firstAllowedPhase: "2C",
    requiredPermission: "VIEW",
    mutationBoundary: "read_only_phase",
    tenantScoped: true,
    environmentScoped: true,
    auditRequired: true,
    purpose: "Stores current quantity by organisation, environment, location, and item. Mutated only by governed movement posting."
  },
  {
    modelName: "InventoryMovement",
    family: "movement_ledger",
    status: "contracted",
    firstAllowedPhase: "2C",
    requiredPermission: "VIEW",
    mutationBoundary: "read_only_phase",
    tenantScoped: true,
    environmentScoped: true,
    auditRequired: true,
    purpose: "Immutable ledger of stock movement facts including opening balance, receiving, wastage, store use, stocktake, and adjustment events."
  },
  {
    modelName: "InventorySupplier",
    family: "supplier",
    status: "contracted",
    firstAllowedPhase: "2C",
    requiredPermission: "VIEW",
    mutationBoundary: "read_only_phase",
    tenantScoped: true,
    environmentScoped: true,
    auditRequired: true,
    purpose: "Defines supplier directory records visible to Inventory purchasing workflows."
  },
  {
    modelName: "InventorySupplierItem",
    family: "supplier_item_mapping",
    status: "contracted",
    firstAllowedPhase: "2C",
    requiredPermission: "VIEW",
    mutationBoundary: "read_only_phase",
    tenantScoped: true,
    environmentScoped: true,
    auditRequired: true,
    purpose: "Maps item master records to supplier-specific codes, pack sizes, lead times, and costs."
  },
  {
    modelName: "InventoryPurchaseOrder",
    family: "purchase_order",
    status: "prisma_draft_only",
    firstAllowedPhase: "2H",
    requiredPermission: "APPROVE",
    mutationBoundary: "operational_write_phase",
    tenantScoped: true,
    environmentScoped: true,
    auditRequired: true,
    purpose: "Prepared for future PO draft, submit, approve, reject, and tracking workflows."
  },
  {
    modelName: "InventoryReceivingSession",
    family: "receiving",
    status: "prisma_draft_only",
    firstAllowedPhase: "2H",
    requiredPermission: "CREATE",
    mutationBoundary: "operational_write_phase",
    tenantScoped: true,
    environmentScoped: true,
    auditRequired: true,
    purpose: "Prepared for future receiving confirmation and discrepancy workflows."
  },
  {
    modelName: "InventoryImportBatch",
    family: "import_batch",
    status: "prisma_draft_only",
    firstAllowedPhase: "2F",
    requiredPermission: "CREATE",
    mutationBoundary: "import_preview_phase",
    tenantScoped: true,
    environmentScoped: true,
    auditRequired: true,
    purpose: "Prepared for future upload, validation preview, approval, and commit workflows."
  },
  {
    modelName: "InventoryConfiguration",
    family: "configuration",
    status: "contracted",
    firstAllowedPhase: "2C",
    requiredPermission: "ADMINISTER",
    mutationBoundary: "read_only_phase",
    tenantScoped: true,
    environmentScoped: true,
    auditRequired: true,
    purpose: "Stores future Inventory configuration snapshots by organisation and environment."
  }
] as const;

export const inventoryReadOnlyApiContract = [
  "GET /api/inventory/readiness",
  "GET /api/inventory/items",
  "GET /api/inventory/suppliers",
  "GET /api/inventory/movements",
  "GET /api/inventory/configuration"
] as const;

export const inventoryDeferredMutationBoundaries = [
  "No POST /api/inventory/items in Phase 2B",
  "No upload endpoint in Phase 2B",
  "No CSV parser in Phase 2B",
  "No import commit in Phase 2B",
  "No opening balance posting in Phase 2B",
  "No stock mutation in Phase 2B",
  "No purchase order submission in Phase 2B",
  "No receiving confirmation in Phase 2B"
] as const;
