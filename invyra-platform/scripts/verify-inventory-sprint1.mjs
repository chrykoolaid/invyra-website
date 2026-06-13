import fs from "node:fs";

const required = [
  "lib/inventory/inventory-master-write-service.ts",
  "app/api/inventory/items/route.ts",
  "app/api/inventory/items/[id]/route.ts",
  "app/api/inventory/items/[id]/restore/route.ts",
  "app/api/inventory/suppliers/route.ts",
  "app/api/inventory/suppliers/[id]/route.ts",
  "app/api/inventory/suppliers/[id]/restore/route.ts",
  "app/portal/inventory/items/page.tsx",
  "app/portal/inventory/suppliers/page.tsx",
  "components/inventory/MasterDataClient.tsx",
  "prisma/migrations/20260613090000_inventory_sprint1_master_data/migration.sql",
  "docs/INVENTORY_SPRINT1_IMPLEMENTATION_REPORT.md",
  "docs/INVENTORY_SPRINT1_ACCEPTANCE_TESTS.md"
];

const missing = required.filter((path) => !fs.existsSync(path));
if (missing.length) {
  console.error("Missing Sprint 1 files:", missing.join(", "));
  process.exit(1);
}

const itemsRoute = fs.readFileSync("app/api/inventory/items/route.ts", "utf8");
const suppliersRoute = fs.readFileSync("app/api/inventory/suppliers/route.ts", "utf8");
const service = fs.readFileSync("lib/inventory/inventory-master-write-service.ts", "utf8");

for (const token of ["POST", "ITEM_CREATED", "ITEM_UPDATED", "ITEM_ARCHIVED", "ITEM_RESTORED", "stockMutationEnabled: false"]) {
  if (!(itemsRoute + service).includes(token)) throw new Error(`Item Sprint 1 token missing: ${token}`);
}
for (const token of ["POST", "SUPPLIER_CREATED", "SUPPLIER_UPDATED", "SUPPLIER_ARCHIVED", "SUPPLIER_RESTORED", "stockMutationEnabled: false"]) {
  if (!(suppliersRoute + service).includes(token)) throw new Error(`Supplier Sprint 1 token missing: ${token}`);
}

console.log("Inventory Sprint 1 static verification passed.");
