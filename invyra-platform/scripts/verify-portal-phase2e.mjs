import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];
const requireFile = (file) => {
  if (!exists(file)) failures.push(`Missing required file: ${file}`);
};
const requireIncludes = (file, text) => {
  if (!exists(file)) {
    failures.push(`Cannot inspect missing file: ${file}`);
    return;
  }
  const body = read(file);
  if (!body.includes(text)) failures.push(`${file} does not include required text: ${text}`);
};

const schema = "prisma/schema.prisma";
requireFile(schema);
[
  "enum InventoryItemStatus",
  "enum InventoryMovementType",
  "model InventoryLocation",
  "model InventoryItem",
  "model InventoryStockBalance",
  "model InventoryMovement",
  "model InventorySupplier",
  "model InventorySupplierItem",
  "model InventoryPurchaseOrder",
  "model InventoryPurchaseOrderLine",
  "model InventoryReceivingBatch",
  "model InventoryReceivingLine",
  "model InventoryConfiguration",
  "model InventoryImportBatch",
  "model InventoryImportRow",
  "organisationId  String",
  "environmentName EnvironmentName"
].forEach((text) => requireIncludes(schema, text));

const migration = "prisma/migrations/20260612020000_inventory_schema_activation/migration.sql";
requireFile(migration);
[
  "CREATE TABLE \"InventoryItem\"",
  "CREATE TABLE \"InventoryMovement\"",
  "CREATE TABLE \"InventorySupplier\"",
  "CREATE TYPE \"InventoryMovementType\"",
  "CREATE UNIQUE INDEX \"InventoryItem_organisationId_environmentName_sku_key\""
].forEach((text) => requireIncludes(migration, text));

const readOnlyApi = read("lib/inventory/inventory-read-only-api.ts");
if (!readOnlyApi.includes("INVENTORY_READ_ONLY_API_PHASE = \"2E\"") && !readOnlyApi.includes("INVENTORY_READ_ONLY_API_PHASE = \"2F\"")) {
  failures.push("lib/inventory/inventory-read-only-api.ts does not include an accepted Phase 2E+ read-only API phase");
}
if (!readOnlyApi.includes("schema_activated_read_only") && !readOnlyApi.includes("read_only_data_service_wired")) {
  failures.push("lib/inventory/inventory-read-only-api.ts does not include an accepted schema-activated/read-only service backend status");
}
requireIncludes("lib/inventory/inventory-read-only-api.ts", "writeEnabled: false");
requireIncludes("lib/inventory/inventory-read-only-api.ts", "stockMutationEnabled: false");

[
  "docs/PORTAL_BUILD_PHASE2E_IMPLEMENTATION_REPORT.md",
  "docs/PORTAL_BUILD_PHASE2E_ACCEPTANCE_TESTS.md",
  "docs/INVENTORY_SCHEMA_ACTIVATION_IMPLEMENTATION.md",
  "docs/INVENTORY_SCHEMA_ACTIVATION_MIGRATION_NOTES.md",
  "docs/PORTAL_PHASE2E_SCHEMA_ACTIVATION_MANIFEST.json"
].forEach(requireFile);

const forbiddenWriteRoutes = [
  "app/api/inventory/items/create/route.ts",
  "app/api/inventory/suppliers/create/route.ts",
  "app/api/inventory/movements/create/route.ts",
  "app/api/inventory/imports/upload/route.ts"
];
for (const file of forbiddenWriteRoutes) {
  if (exists(file)) failures.push(`Forbidden write/upload route exists in Phase 2E: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
if (packageJson.scripts?.["verify:portal-phase2e"] !== "node scripts/verify-portal-phase2e.mjs") {
  failures.push("package.json is missing verify:portal-phase2e script");
}

if (failures.length) {
  console.error("Portal Phase 2E verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Portal Phase 2E verification passed.");
console.log("Phase 2E Inventory Prisma schema activation checks passed.");
