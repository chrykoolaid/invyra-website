#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const siteRoot = path.dirname(root);
const checks = [];

function filePath(relativePath) { return path.join(root, relativePath); }
function siteFilePath(relativePath) { return path.join(siteRoot, relativePath); }
function read(relativePath) { return fs.readFileSync(filePath(relativePath), "utf8"); }
function readSite(relativePath) { return fs.readFileSync(siteFilePath(relativePath), "utf8"); }
function exists(relativePath) { return fs.existsSync(filePath(relativePath)); }
function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const platformFiles = [
  "docs/PORTAL_BUILD_PHASE2C_IMPLEMENTATION_REPORT.md",
  "docs/PORTAL_BUILD_PHASE2C_ACCEPTANCE_TESTS.md",
  "docs/INVENTORY_READ_ONLY_API_FOUNDATION.md",
  "docs/INVENTORY_READ_ONLY_API_ROUTE_MATRIX.md",
  "docs/PORTAL_PHASE2C_READ_ONLY_API_MANIFEST.json",
  "lib/inventory/inventory-read-only-api.ts",
  "app/api/inventory/readiness/route.ts",
  "app/api/inventory/items/route.ts",
  "app/api/inventory/suppliers/route.ts",
  "app/api/inventory/movements/route.ts",
  "app/api/inventory/configuration/route.ts",
  "scripts/verify-portal-phase2c.mjs",
  "docs/ROUTE_PROTECTION_MANIFEST.md",
  "package.json",
  "prisma/schema.prisma"
];

const siteFiles = [
  "PORTAL_BUILD_PHASE2C_IMPLEMENTATION_REPORT.md",
  "PORTAL_BUILD_PHASE2C_ACCEPTANCE_TESTS.md"
];

for (const file of platformFiles) check(`required platform file exists: ${file}`, exists(file));
for (const file of siteFiles) check(`required root file exists: ${file}`, fs.existsSync(siteFilePath(file)));

const packageJson = JSON.parse(read("package.json"));
const report = read("docs/PORTAL_BUILD_PHASE2C_IMPLEMENTATION_REPORT.md");
const rootReport = readSite("PORTAL_BUILD_PHASE2C_IMPLEMENTATION_REPORT.md");
const acceptance = read("docs/PORTAL_BUILD_PHASE2C_ACCEPTANCE_TESTS.md");
const foundation = read("docs/INVENTORY_READ_ONLY_API_FOUNDATION.md");
const routeMatrix = read("docs/INVENTORY_READ_ONLY_API_ROUTE_MATRIX.md");
const manifest = JSON.parse(read("docs/PORTAL_PHASE2C_READ_ONLY_API_MANIFEST.json"));
const helper = read("lib/inventory/inventory-read-only-api.ts");
const routeManifest = read("docs/ROUTE_PROTECTION_MANIFEST.md");
const liveSchema = read("prisma/schema.prisma");
const phase2fWired = helper.includes('INVENTORY_READ_ONLY_API_PHASE = "2F"') && helper.includes("read_only_data_service_wired");

check("package exposes Phase 2C verifier", packageJson.scripts?.["verify:portal-phase2c"] === "node scripts/verify-portal-phase2c.mjs");
check("Phase 2B verifier remains exposed", packageJson.scripts?.["verify:portal-phase2b"] === "node scripts/verify-portal-phase2b.mjs");
check("root and docs Phase 2C reports match", rootReport === report);
check("report states read-only API boundary", report.includes("read-only") && report.includes("No Prisma Inventory model queries") && report.includes("No writes"));

const routes = {
  "readiness": { path: "app/api/inventory/readiness/route.ts", level: 'level: "VIEW"' },
  "items": { path: "app/api/inventory/items/route.ts", level: 'level: "VIEW"' },
  "suppliers": { path: "app/api/inventory/suppliers/route.ts", level: 'level: "VIEW"' },
  "movements": { path: "app/api/inventory/movements/route.ts", level: 'level: "VIEW"' },
  "configuration": { path: "app/api/inventory/configuration/route.ts", level: 'level: "ADMINISTER"' }
};

for (const [name, info] of Object.entries(routes)) {
  const source = read(info.path);
  check(`${name} route exports GET only`, source.includes("export async function GET") && !/export async function (POST|PUT|PATCH|DELETE)/.test(source));
  check(`${name} route uses requirePlatformAccess`, source.includes("requirePlatformAccess"));
  check(`${name} route guards INVENTORY module`, source.includes('module: "INVENTORY"'));
  check(`${name} route uses expected permission`, source.includes(info.level));
  check(`${name} route returns ok response`, source.includes("return ok("));
  check(`${name} route does not query prisma inventory models`, !/prisma\.(inventory|Inventory)/.test(source));
}

check(
  "helper exposes Phase 2C+ read-only metadata",
  ["INVENTORY_READ_ONLY_API_PHASE", "backendStatus", "writeEnabled: false", "uploadsEnabled: false", "stockMutationEnabled: false"].every((token) => helper.includes(token)) &&
    (helper.includes("liveDataConnected: false") || helper.includes("liveDataConnected: true"))
);

check(
  "helper returns empty collection records or Phase 2F read-only service records",
  phase2fWired || (helper.match(/records: \[\]/g) ?? []).length >= 4
);

check(
  "helper includes all route payload builders",
  ["buildInventoryReadinessApiPayload", "buildInventoryItemsApiPayload", "buildInventorySuppliersApiPayload", "buildInventoryMovementsApiPayload", "buildInventoryConfigurationApiPayload"].every((token) => helper.includes(token))
);

const endpointTokens = [
  "GET /api/inventory/readiness",
  "GET /api/inventory/items",
  "GET /api/inventory/suppliers",
  "GET /api/inventory/movements",
  "GET /api/inventory/configuration"
];

check("foundation doc lists all endpoints", endpointTokens.every((token) => foundation.includes(token)));
check("route matrix lists all endpoints", endpointTokens.every((token) => routeMatrix.includes(token)));
check("route matrix identifies configuration as ADMINISTER", routeMatrix.includes("INVENTORY.ADMINISTER"));
check("acceptance tests forbid write methods", acceptance.includes("No Inventory API route may export POST, PUT, PATCH, or DELETE"));
check("acceptance tests forbid prisma inventory model calls", acceptance.includes("No route may call `prisma.inventory...` models"));
check("route manifest includes Phase 2C addendum", routeManifest.includes("Portal Build Development Phase 2C Read-only Inventory API Foundation Addendum"));
check("route manifest lists configuration ADMINISTER", routeManifest.includes("GET /api/inventory/configuration  INVENTORY.ADMINISTER"));

check(
  "manifest identifies read-only API ready status",
  manifest.phase === "2C" && manifest.status === "READ_ONLY_API_READY" && manifest.writeMethodsAdded === false
);
check(
  "manifest confirms no schema/migration/upload/parser/stock mutation enablement",
  manifest.prismaSchemaChanged === false && manifest.prismaMigrationsAdded === false && manifest.uploadsEnabled === false && manifest.csvParsingEnabled === false && manifest.stockMutationEnabled === false
);
check("manifest points to Phase 2D next", manifest.recommendedNextPhase === "Phase 2D — Inventory Prisma Schema Activation Plan");

const phase2eActivated = exists("docs/PORTAL_PHASE2E_SCHEMA_ACTIVATION_MANIFEST.json");
const forbiddenLiveSchemaModels = [
  "InventoryLocation", "InventoryItem", "InventoryStockBalance", "InventoryMovement", "InventorySupplier", "InventorySupplierItem", "InventoryConfiguration", "InventoryImportBatch", "InventoryImportRow"
].map((model) => `model ${model}`);
check("Phase 2C did not add contracted Inventory models to live prisma/schema.prisma, unless superseded by Phase 2E", phase2eActivated || forbiddenLiveSchemaModels.every((token) => !liveSchema.includes(token)));

const migrationDir = filePath("prisma/migrations");
const migrations = fs.existsSync(migrationDir) ? fs.readdirSync(migrationDir).join("\n") : "";
check("Phase 2C did not add inventory migration folders, unless superseded by Phase 2E", phase2eActivated || !/inventory/i.test(migrations));

check("CRM and POS future-only pages remain present", exists("app/portal/crm/page.tsx") && exists("app/portal/pos/page.tsx"));

const failed = checks.filter((entry) => !entry.ok);
if (failed.length > 0) {
  console.error(`\nPortal Phase 2C verification failed with ${failed.length} issue(s).`);
  process.exit(1);
}

console.log("\nPortal Phase 2C verification passed.");
if (phase2fWired) console.log("Phase 2C read-only Inventory API foundation checks passed in superseded mode because Phase 2F data service wiring is present.");
else if (phase2eActivated) console.log("Phase 2C read-only Inventory API foundation checks passed in superseded mode because Phase 2E schema activation is present.");
else console.log("Phase 2C read-only Inventory API foundation checks passed.");
