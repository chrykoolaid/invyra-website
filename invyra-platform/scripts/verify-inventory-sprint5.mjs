import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "lib/inventory/inventory-transfer-service.ts",
  "app/api/inventory/locations/route.ts",
  "app/api/inventory/transfers/route.ts",
  "app/api/inventory/transfers/[id]/approve/route.ts",
  "app/api/inventory/transfers/[id]/dispatch/route.ts",
  "app/api/inventory/transfers/[id]/receive/route.ts",
  "app/api/inventory/in-transit/route.ts",
  "docs/INVENTORY_SPRINT5_IMPLEMENTATION_REPORT.md",
  "docs/INVENTORY_SPRINT5_ACCEPTANCE_TESTS.md"
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing Sprint 5 file: ${file}`);
}

const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
const service = fs.readFileSync(path.join(root, "lib/inventory/inventory-transfer-service.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "app/portal/inventory/page.tsx"), "utf8");

const checks = [
  [schema.includes("enum InventoryTransferStatus"), "InventoryTransferStatus enum exists"],
  [schema.includes("model InventoryTransfer"), "InventoryTransfer model exists"],
  [schema.includes("model InventoryTransferLine"), "InventoryTransferLine model exists"],
  [schema.includes("type            InventoryLocationType"), "Location type added"],
  [service.includes("TRANSFER_OUT"), "TRANSFER_OUT movement integrated"],
  [service.includes("TRANSFER_IN"), "TRANSFER_IN movement integrated"],
  [service.includes("Source location does not have enough stock"), "Availability protection exists"],
  [service.includes("In-transit" ) || service.includes("inTransit"), "In-transit derivation exists"],
  [page.includes("Locations & Transfers · Sprint 5"), "Portal dashboard includes Sprint 5 section"]
];

const failed = checks.filter(([ok]) => !ok);
if (failed.length) {
  for (const [, label] of failed) console.error(`FAIL: ${label}`);
  process.exit(1);
}

console.log("Inventory Sprint 5 verification passed");
