import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "lib/inventory/inventory-ledger-service.ts",
  "app/api/inventory/opening-balances/route.ts",
  "app/api/inventory/adjustments/route.ts",
  "app/api/inventory/stock-balances/route.ts",
  "app/portal/inventory/ledger/page.tsx",
  "components/inventory/LedgerClient.tsx",
  "prisma/migrations/20260613100000_inventory_sprint2_ledger_foundation/migration.sql",
  "docs/INVENTORY_SPRINT2_IMPLEMENTATION_REPORT.md",
  "docs/INVENTORY_SPRINT2_ACCEPTANCE_TESTS.md"
];

const requiredText = [
  ["lib/inventory/inventory-ledger-service.ts", "createOpeningBalance"],
  ["lib/inventory/inventory-ledger-service.ts", "createStockAdjustment"],
  ["lib/inventory/inventory-ledger-service.ts", "Opening balance already exists"],
  ["lib/inventory/inventory-ledger-service.ts", "Movement would create negative stock"],
  ["lib/inventory/inventory-ledger-service.ts", "quantityBefore"],
  ["lib/inventory/inventory-ledger-service.ts", "inventoryStockBalance.upsert"],
  ["app/api/inventory/opening-balances/route.ts", "level: \"APPROVE\""],
  ["app/api/inventory/adjustments/route.ts", "level: \"APPROVE\""],
  ["components/inventory/LedgerClient.tsx", "Create Opening Balance"],
  ["components/inventory/LedgerClient.tsx", "Post Adjustment"],
  ["components/PortalShell.tsx", "/portal/inventory/ledger"],
  ["prisma/schema.prisma", "quantityBefore"]
];

let failed = false;

for (const file of requiredFiles) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.error(`Missing required file: ${file}`);
    failed = true;
  }
}

for (const [file, text] of requiredText) {
  const full = path.join(root, file);
  const contents = fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
  if (!contents.includes(text)) {
    console.error(`Missing required text in ${file}: ${text}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("Inventory Sprint 2 verification passed: ledger service, routes, UI, migration, protections and docs are present.");
