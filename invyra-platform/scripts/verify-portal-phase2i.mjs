import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];
const requireFile = (file) => { if (!exists(file)) failures.push(`Missing required file: ${file}`); };
const requireIncludes = (file, text) => {
  if (!exists(file)) { failures.push(`Cannot inspect missing file: ${file}`); return; }
  if (!read(file).includes(text)) failures.push(`${file} does not include required text: ${text}`);
};
const requireNotExists = (file) => { if (exists(file)) failures.push(`Forbidden file exists: ${file}`); };
const requireNotIncludes = (file, text) => {
  if (exists(file) && read(file).includes(text)) failures.push(`${file} includes forbidden text: ${text}`);
};

[
  "prisma/seed-inventory-readonly-demo.ts",
  "docs/INVENTORY_READ_ONLY_DEMO_SEED_PACK.md",
  "docs/PORTAL_BUILD_PHASE2I_IMPLEMENTATION_REPORT.md",
  "docs/PORTAL_BUILD_PHASE2I_ACCEPTANCE_TESTS.md",
  "docs/PORTAL_PHASE2I_READ_ONLY_DEMO_SEED_MANIFEST.json"
].forEach(requireFile);

requireIncludes("prisma/seed-inventory-readonly-demo.ts", "invyra_demo_organisation");
requireIncludes("prisma/seed-inventory-readonly-demo.ts", "EnvironmentName.LIVE");
requireIncludes("prisma/seed-inventory-readonly-demo.ts", "EnvironmentName.TRAINING");
requireIncludes("prisma/seed-inventory-readonly-demo.ts", "EnvironmentName.TEST");
requireIncludes("prisma/seed-inventory-readonly-demo.ts", "prisma.inventoryLocation.upsert");
requireIncludes("prisma/seed-inventory-readonly-demo.ts", "prisma.inventoryItem.upsert");
requireIncludes("prisma/seed-inventory-readonly-demo.ts", "prisma.inventorySupplier.upsert");
requireIncludes("prisma/seed-inventory-readonly-demo.ts", "prisma.inventoryStockBalance.upsert");
requireIncludes("prisma/seed-inventory-readonly-demo.ts", "prisma.inventoryMovement.upsert");
requireIncludes("prisma/seed-inventory-readonly-demo.ts", "prisma.inventoryConfiguration.upsert");
requireIncludes("prisma/seed-inventory-readonly-demo.ts", "writes, uploads, imports, and stock mutation remain disabled");

requireIncludes("docs/INVENTORY_READ_ONLY_DEMO_SEED_PACK.md", "npm run seed:inventory-readonly-demo");
requireIncludes("docs/INVENTORY_READ_ONLY_DEMO_SEED_PACK.md", "The seed script itself writes local demo rows to the database, but the protected portal and API remain read-only.");
requireIncludes("docs/PORTAL_BUILD_PHASE2I_IMPLEMENTATION_REPORT.md", "Phase 2I — Inventory Read-only Demo Seed Pack");
requireIncludes("docs/PORTAL_BUILD_PHASE2I_ACCEPTANCE_TESTS.md", "Portal Phase 2I verification passed.");
requireIncludes("docs/PORTAL_PHASE2I_READ_ONLY_DEMO_SEED_MANIFEST.json", "stockMutationEnabled");
requireIncludes("docs/ROUTE_PROTECTION_MANIFEST.md", "Phase 2H Addendum — Inventory Read-only Runtime QA + Local Data Seed Review");

const packageJson = JSON.parse(read("package.json"));
if (packageJson.scripts?.["seed:inventory-readonly-demo"] !== "tsx prisma/seed-inventory-readonly-demo.ts") failures.push("package.json missing seed:inventory-readonly-demo script");
if (packageJson.scripts?.["verify:portal-phase2i"] !== "node scripts/verify-portal-phase2i.mjs") failures.push("package.json missing verify:portal-phase2i script");

[
  "app/api/inventory/items/create/route.ts",
  "app/api/inventory/suppliers/create/route.ts",
  "app/api/inventory/movements/create/route.ts",
  "app/api/inventory/imports/upload/route.ts",
  "app/api/inventory/imports/commit/route.ts",
  "app/api/inventory/configuration/save/route.ts"
].forEach(requireNotExists);

[
  "app/api/inventory/readiness/route.ts",
  "app/api/inventory/items/route.ts",
  "app/api/inventory/suppliers/route.ts",
  "app/api/inventory/movements/route.ts",
  "app/api/inventory/configuration/route.ts"
].forEach((file) => {
  requireFile(file);
  requireNotIncludes(file, "export async function POST");
  requireNotIncludes(file, ".create(");
  requireNotIncludes(file, ".update(");
  requireNotIncludes(file, ".delete(");
});

if (failures.length) {
  console.error("Portal Phase 2I verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Portal Phase 2I verification passed.");
console.log("Phase 2I read-only demo seed pack checks passed.");
