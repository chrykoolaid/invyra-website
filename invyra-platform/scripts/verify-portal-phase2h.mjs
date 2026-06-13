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
  "docs/PORTAL_BUILD_PHASE2H_IMPLEMENTATION_REPORT.md",
  "docs/PORTAL_BUILD_PHASE2H_ACCEPTANCE_TESTS.md",
  "docs/INVENTORY_READ_ONLY_RUNTIME_QA_GUIDE.md",
  "docs/INVENTORY_LOCAL_DATA_SEED_REVIEW.md",
  "docs/INVENTORY_READ_ONLY_RUNTIME_QA_MATRIX.md",
  "docs/PORTAL_PHASE2H_RUNTIME_QA_MANIFEST.json",
  "scripts/inventory-readonly-api-smoke.mjs",
  "scripts/inventory-seed-review.mjs"
].forEach(requireFile);

requireIncludes("docs/PORTAL_BUILD_PHASE2H_IMPLEMENTATION_REPORT.md", "Phase 2H — Inventory Read-only Portal Runtime QA + Local Data Seed Review");
requireIncludes("docs/INVENTORY_LOCAL_DATA_SEED_REVIEW.md", "Inventory operational seed rows are not required yet");
requireIncludes("docs/INVENTORY_READ_ONLY_RUNTIME_QA_GUIDE.md", "npm run smoke:inventory-readonly-api");
requireIncludes("docs/INVENTORY_READ_ONLY_RUNTIME_QA_MATRIX.md", "POST to read-only API routes");
requireIncludes("docs/PORTAL_PHASE2H_RUNTIME_QA_MANIFEST.json", "no writes");
requireIncludes("scripts/inventory-readonly-api-smoke.mjs", "POST remains not enabled on read-only Inventory API");
requireIncludes("scripts/inventory-readonly-api-smoke.mjs", "/api/inventory/readiness");
requireIncludes("scripts/inventory-readonly-api-smoke.mjs", "/api/inventory/configuration");
requireIncludes("scripts/inventory-seed-review.mjs", "Phase 2I — Inventory Read-only Demo Seed Pack");
requireIncludes("scripts/inventory-seed-review.mjs", "requiredForPhase2H: false");
requireIncludes("docs/ROUTE_PROTECTION_MANIFEST.md", "Phase 2H Addendum — Inventory Read-only Runtime QA + Local Data Seed Review");

const packageJson = JSON.parse(read("package.json"));
if (packageJson.scripts?.["verify:portal-phase2h"] !== "node scripts/verify-portal-phase2h.mjs") failures.push("package.json missing verify:portal-phase2h script");
if (packageJson.scripts?.["smoke:inventory-readonly-api"] !== "node scripts/inventory-readonly-api-smoke.mjs") failures.push("package.json missing smoke:inventory-readonly-api script");
if (packageJson.scripts?.["review:inventory-seed"] !== "node scripts/inventory-seed-review.mjs") failures.push("package.json missing review:inventory-seed script");

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
  console.error("Portal Phase 2H verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Portal Phase 2H verification passed.");
console.log("Phase 2H runtime QA and local seed review checks passed.");
