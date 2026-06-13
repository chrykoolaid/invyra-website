#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const siteRoot = path.dirname(root);
const checks = [];

function filePath(relativePath) {
  return path.join(root, relativePath);
}

function siteFilePath(relativePath) {
  return path.join(siteRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(filePath(relativePath), "utf8");
}

function readSite(relativePath) {
  return fs.readFileSync(siteFilePath(relativePath), "utf8");
}

function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const requiredPlatformFiles = [
  "docs/PORTAL_BUILD_PHASE2B_IMPLEMENTATION_REPORT.md",
  "docs/PORTAL_BUILD_PHASE2B_ACCEPTANCE_TESTS.md",
  "docs/INVENTORY_DATA_MODEL_CONTRACT.md",
  "docs/INVENTORY_PRISMA_SCHEMA_DRAFT.prisma",
  "docs/INVENTORY_TENANT_ENVIRONMENT_RULES.md",
  "docs/INVENTORY_PERMISSION_ACTION_MATRIX.md",
  "docs/INVENTORY_AUDIT_ACTION_TAXONOMY.md",
  "docs/INVENTORY_SEED_STRATEGY.md",
  "docs/INVENTORY_READ_ONLY_API_CONTRACT.md",
  "docs/PORTAL_PHASE2B_DATA_MODEL_CONTRACT_MANIFEST.json",
  "lib/inventory/inventory-data-model-contract.ts",
  "scripts/verify-portal-phase2b.mjs",
  "docs/ROUTE_PROTECTION_MANIFEST.md",
  "package.json",
  "prisma/schema.prisma"
];

const requiredSiteFiles = [
  "PORTAL_BUILD_PHASE2B_IMPLEMENTATION_REPORT.md",
  "PORTAL_BUILD_PHASE2B_ACCEPTANCE_TESTS.md"
];

for (const file of requiredPlatformFiles) {
  check(`required platform file exists: ${file}`, fs.existsSync(filePath(file)));
}

for (const file of requiredSiteFiles) {
  check(`required root file exists: ${file}`, fs.existsSync(siteFilePath(file)));
}

const packageJson = JSON.parse(read("package.json"));
const report = read("docs/PORTAL_BUILD_PHASE2B_IMPLEMENTATION_REPORT.md");
const rootReport = readSite("PORTAL_BUILD_PHASE2B_IMPLEMENTATION_REPORT.md");
const acceptance = read("docs/PORTAL_BUILD_PHASE2B_ACCEPTANCE_TESTS.md");
const contract = read("docs/INVENTORY_DATA_MODEL_CONTRACT.md");
const prismaDraft = read("docs/INVENTORY_PRISMA_SCHEMA_DRAFT.prisma");
const tenantRules = read("docs/INVENTORY_TENANT_ENVIRONMENT_RULES.md");
const permissionMatrix = read("docs/INVENTORY_PERMISSION_ACTION_MATRIX.md");
const auditTaxonomy = read("docs/INVENTORY_AUDIT_ACTION_TAXONOMY.md");
const seedStrategy = read("docs/INVENTORY_SEED_STRATEGY.md");
const readOnlyApi = read("docs/INVENTORY_READ_ONLY_API_CONTRACT.md");
const manifest = JSON.parse(read("docs/PORTAL_PHASE2B_DATA_MODEL_CONTRACT_MANIFEST.json"));
const tsContract = read("lib/inventory/inventory-data-model-contract.ts");
const routeManifest = read("docs/ROUTE_PROTECTION_MANIFEST.md");
const liveSchema = read("prisma/schema.prisma");

check(
  "package exposes Phase 2B verifier",
  packageJson.scripts?.["verify:portal-phase2b"] === "node scripts/verify-portal-phase2b.mjs"
);

check(
  "Phase 2A verifier remains exposed",
  packageJson.scripts?.["verify:portal-phase2a"] === "node scripts/verify-portal-phase2a.mjs"
);

check(
  "root and docs Phase 2B reports match",
  rootReport === report
);

check(
  "report states contract-only boundary",
  report.includes("contract-only") && report.includes("does not add live Prisma models") && report.includes("does not introduce")
);

const requiredModels = [
  "InventoryLocation",
  "InventoryItem",
  "InventoryStockBalance",
  "InventoryMovement",
  "InventorySupplier",
  "InventorySupplierItem",
  "InventoryConfiguration",
  "InventoryImportBatch",
  "InventoryImportRow"
];

check(
  "data model contract names first model slice",
  requiredModels.every((token) => contract.includes(token))
);

check(
  "Prisma draft contains first model slice but is clearly draft-only",
  requiredModels.every((token) => prismaDraft.includes(`model ${token}`)) && prismaDraft.includes("CONTRACT DRAFT ONLY")
);

check(
  "tenant rules require organisation and environment scope",
  ["organisationId", "environmentName", "LIVE stock cannot be visible in TRAINING", "No Inventory query should be allowed without an organisation filter"].every((token) => tenantRules.includes(token))
);

check(
  "permission matrix maps all core workflows",
  ["Items", "Movements", "Suppliers", "Orders", "Receiving", "Wastage", "Store Use", "Reorder Review", "Gap Scan", "Stocktake", "Imports", "Configuration"].every((token) => permissionMatrix.includes(token))
);

check(
  "permission matrix keeps write phases deferred",
  permissionMatrix.includes("2E") && permissionMatrix.includes("2F") && permissionMatrix.includes("2G") && permissionMatrix.includes("2H") && permissionMatrix.includes("Phase 2B does not add these actions")
);

check(
  "audit taxonomy includes key Inventory events",
  ["INVENTORY_ITEM_CREATED", "INVENTORY_OPENING_BALANCE_POSTED", "INVENTORY_PO_APPROVED", "INVENTORY_RECEIVING_CONFIRMED", "INVENTORY_STOCKTAKE_VARIANCE_APPROVED"].every((token) => auditTaxonomy.includes(token))
);

check(
  "seed strategy forbids fake live operational data",
  seedStrategy.includes("Phase 2B does not change `prisma/seed.ts`") && seedStrategy.includes("LIVE should start empty") && seedStrategy.includes("Fake purchase orders")
);

const readOnlyEndpoints = [
  "GET /api/inventory/readiness",
  "GET /api/inventory/items",
  "GET /api/inventory/suppliers",
  "GET /api/inventory/movements",
  "GET /api/inventory/configuration"
];

check(
  "read-only API contract defines Phase 2C endpoint candidates",
  readOnlyEndpoints.every((endpoint) => readOnlyApi.includes(endpoint))
);

check(
  "read-only API contract requires platform guard",
  readOnlyApi.includes('requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" })')
);

check(
  "manifest identifies Phase 2B as contract-ready",
  manifest.phase === "2B" && manifest.status === "CONTRACT_READY" && manifest.contractOnly === true
);

check(
  "manifest confirms no schema/API/upload/stock mutation enablement",
  manifest.prismaSchemaChanged === false && manifest.apiRoutesAdded === false && manifest.uploadsEnabled === false && manifest.stockMutationEnabled === false
);

check(
  "manifest points to Phase 2C next",
  manifest.recommendedNextPhase === "Phase 2C — Read-only Inventory API Foundation"
);

check(
  "TypeScript contract exposes model families and endpoints",
  ["inventoryDataModelFamilies", "inventoryModelContract", "inventoryReadOnlyApiContract", "inventoryDeferredMutationBoundaries"].every((token) => tsContract.includes(token))
);

check(
  "TypeScript contract lists first read-only endpoints",
  readOnlyEndpoints.every((endpoint) => tsContract.includes(endpoint))
);

check(
  "route manifest includes Phase 2B addendum",
  routeManifest.includes("Portal Build Development Phase 2B Inventory Data Model Contract Addendum")
);

check(
  "acceptance tests forbid live backend additions",
  acceptance.includes("No live Inventory Prisma operational models are added") && acceptance.includes("No /app/api/inventory route directory is added")
);

const phase2eActivated = fs.existsSync(filePath("docs/PORTAL_PHASE2E_SCHEMA_ACTIVATION_MANIFEST.json"));
const forbiddenLiveSchemaModels = requiredModels.map((model) => `model ${model}`);
check(
  "Phase 2B did not add contracted Inventory models to live prisma/schema.prisma, unless superseded by Phase 2E",
  phase2eActivated || forbiddenLiveSchemaModels.every((token) => !liveSchema.includes(token))
);

check(
  "Phase 2B live API boundary remains valid or later Phase 2C manifest is present",
  !fs.existsSync(filePath("app/api/inventory")) || fs.existsSync(filePath("docs/PORTAL_PHASE2C_READ_ONLY_API_MANIFEST.json"))
);

check(
  "CRM and POS future-only pages remain present",
  fs.existsSync(filePath("app/portal/crm/page.tsx")) && fs.existsSync(filePath("app/portal/pos/page.tsx"))
);

const failed = checks.filter((entry) => !entry.ok);
if (failed.length > 0) {
  console.error(`\nPortal Phase 2B verification failed with ${failed.length} issue(s).`);
  process.exit(1);
}

console.log("\nPortal Phase 2B verification passed.");
if (phase2eActivated) console.log("Phase 2B Inventory data model contract checks passed in superseded mode because Phase 2E schema activation is present.");
else console.log("Phase 2B Inventory data model contract checks passed.");
