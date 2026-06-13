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
  "scripts/inventory-readonly-demo-runtime-smoke.mjs",
  "scripts/inventory-demo-runtime-results-review.mjs",
  "docs/PORTAL_BUILD_PHASE2J_IMPLEMENTATION_REPORT.md",
  "docs/PORTAL_BUILD_PHASE2J_ACCEPTANCE_TESTS.md",
  "docs/PORTAL_PHASE2J_DEMO_RUNTIME_RESULTS_REVIEW_GUIDE.md",
  "docs/PORTAL_PHASE2J_DEMO_RUNTIME_REVIEW_CHECKLIST.md",
  "docs/PORTAL_PHASE2J_LOCAL_RUNTIME_RESULTS_REVIEW.md",
  "docs/PORTAL_PHASE2J_DEMO_RUNTIME_MANIFEST.json"
].forEach(requireFile);

requireIncludes("scripts/inventory-readonly-demo-runtime-smoke.mjs", "INVYRA_INVENTORY_DEMO_RUNTIME_RESULTS");
requireIncludes("scripts/inventory-readonly-demo-runtime-smoke.mjs", "demo readiness includes at least three items");
requireIncludes("scripts/inventory-readonly-demo-runtime-smoke.mjs", "INV-DEMO-LAUNDRY-BAGS");
requireIncludes("scripts/inventory-readonly-demo-runtime-smoke.mjs", "CleanPro Supplies");
requireIncludes("scripts/inventory-readonly-demo-runtime-smoke.mjs", "PHASE2I");
requireIncludes("scripts/inventory-readonly-demo-runtime-smoke.mjs", "writeEnabled === false");
requireIncludes("scripts/inventory-readonly-demo-runtime-smoke.mjs", "uploadsEnabled === false");
requireIncludes("scripts/inventory-readonly-demo-runtime-smoke.mjs", "stockMutationEnabled === false");

requireIncludes("scripts/inventory-demo-runtime-results-review.mjs", "NOT_RUN");
requireIncludes("scripts/inventory-demo-runtime-results-review.mjs", "REVIEW_REQUIRED");
requireIncludes("scripts/inventory-demo-runtime-results-review.mjs", "read_only_boundary_regression");
requireIncludes("scripts/inventory-demo-runtime-results-review.mjs", "demo_seed_or_environment_scope");
requireIncludes("docs/PORTAL_BUILD_PHASE2J_IMPLEMENTATION_REPORT.md", "Phase 2J — Read-only Demo Runtime Results Review");
requireIncludes("docs/PORTAL_BUILD_PHASE2J_ACCEPTANCE_TESTS.md", "Portal Phase 2J verification passed.");
requireIncludes("docs/PORTAL_PHASE2J_DEMO_RUNTIME_RESULTS_REVIEW_GUIDE.md", "npm run smoke:inventory-demo-readonly");
requireIncludes("docs/PORTAL_PHASE2J_DEMO_RUNTIME_REVIEW_CHECKLIST.md", "writeEnabled");
requireIncludes("docs/PORTAL_PHASE2J_LOCAL_RUNTIME_RESULTS_REVIEW.md", "Status: NOT RUN");
requireIncludes("docs/PORTAL_PHASE2J_DEMO_RUNTIME_MANIFEST.json", "stockMutationEnabled");
requireIncludes("docs/ROUTE_PROTECTION_MANIFEST.md", "Phase 2J Addendum — Read-only Demo Runtime Results Review");

const packageJson = JSON.parse(read("package.json"));
if (packageJson.scripts?.["smoke:inventory-demo-readonly"] !== "node scripts/inventory-readonly-demo-runtime-smoke.mjs") failures.push("package.json missing smoke:inventory-demo-readonly script");
if (packageJson.scripts?.["review:inventory-demo-runtime-results"] !== "node scripts/inventory-demo-runtime-results-review.mjs") failures.push("package.json missing review:inventory-demo-runtime-results script");
if (packageJson.scripts?.["verify:portal-phase2j"] !== "node scripts/verify-portal-phase2j.mjs") failures.push("package.json missing verify:portal-phase2j script");

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
  console.error("Portal Phase 2J verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Portal Phase 2J verification passed.");
console.log("Phase 2J read-only demo runtime review checks passed.");
