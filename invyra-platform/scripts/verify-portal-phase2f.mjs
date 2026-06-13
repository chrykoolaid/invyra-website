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
const requireNotIncludes = (file, text) => {
  if (!exists(file)) return;
  const body = read(file);
  if (body.includes(text)) failures.push(`${file} includes forbidden text: ${text}`);
};

const service = "lib/inventory/inventory-read-only-service.ts";
requireFile(service);
[
  "prisma.inventoryItem.findMany",
  "prisma.inventorySupplier.findMany",
  "prisma.inventoryMovement.findMany",
  "prisma.inventoryConfiguration.findMany",
  "prisma.inventoryLocation.count",
  "organisationId: scope.organisationId",
  "environmentName: scope.environmentName",
  "take: 100"
].forEach((text) => requireIncludes(service, text));
[
  ".create(",
  ".createMany(",
  ".update(",
  ".updateMany(",
  ".upsert(",
  ".delete(",
  ".deleteMany(",
  "$executeRaw",
  "$queryRawUnsafe"
].forEach((text) => requireNotIncludes(service, text));

const api = "lib/inventory/inventory-read-only-api.ts";
[
  "INVENTORY_READ_ONLY_API_PHASE = \"2F\"",
  "read_only_data_service_wired",
  "readOnlyDataServiceConnected: true",
  "liveDataConnected: true",
  "writeEnabled: false",
  "uploadsEnabled: false",
  "stockMutationEnabled: false",
  "recordLimit: 100",
  "Phase 2G — Inventory Read-only Portal Data Binding",
  "await listInventoryItems(scope)",
  "await listInventorySuppliers(scope)",
  "await listInventoryMovements(scope)",
  "await listInventoryConfiguration(scope)",
  "await getInventoryReadinessCounts(scope)"
].forEach((text) => requireIncludes(api, text));

const routes = {
  "app/api/inventory/readiness/route.ts": "INVENTORY", 
  "app/api/inventory/items/route.ts": "INVENTORY",
  "app/api/inventory/suppliers/route.ts": "INVENTORY",
  "app/api/inventory/movements/route.ts": "INVENTORY",
  "app/api/inventory/configuration/route.ts": "ADMINISTER"
};
for (const [file, text] of Object.entries(routes)) {
  requireFile(file);
  requireIncludes(file, "return ok(await buildInventory");
  requireIncludes(file, text);
}

[
  "app/api/inventory/items/create/route.ts",
  "app/api/inventory/suppliers/create/route.ts",
  "app/api/inventory/movements/create/route.ts",
  "app/api/inventory/imports/upload/route.ts",
  "app/api/inventory/imports/commit/route.ts",
  "app/api/inventory/configuration/save/route.ts"
].forEach((file) => {
  if (exists(file)) failures.push(`Forbidden write/upload route exists in Phase 2F: ${file}`);
});

[
  "docs/PORTAL_BUILD_PHASE2F_IMPLEMENTATION_REPORT.md",
  "docs/PORTAL_BUILD_PHASE2F_ACCEPTANCE_TESTS.md",
  "docs/INVENTORY_READ_ONLY_DATA_SERVICE_WIRING.md",
  "docs/PORTAL_PHASE2F_READ_ONLY_DATA_SERVICE_MANIFEST.json"
].forEach(requireFile);

requireIncludes("docs/ROUTE_PROTECTION_MANIFEST.md", "Phase 2F Addendum — Read-only Inventory Data Service Wiring");

const packageJson = JSON.parse(read("package.json"));
if (packageJson.scripts?.["verify:portal-phase2f"] !== "node scripts/verify-portal-phase2f.mjs") {
  failures.push("package.json is missing verify:portal-phase2f script");
}

if (failures.length) {
  console.error("Portal Phase 2F verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Portal Phase 2F verification passed.");
console.log("Phase 2F read-only Inventory data service wiring checks passed.");
