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
  "docs/PORTAL_BUILD_PHASE2K_IMPLEMENTATION_REPORT.md",
  "docs/PORTAL_BUILD_PHASE2K_ACCEPTANCE_TESTS.md",
  "docs/PORTAL_PHASE2K_DEMO_PORTAL_UX_QA_GUIDE.md",
  "docs/PORTAL_PHASE2K_DEMO_PORTAL_UX_MANIFEST.json",
  "lib/portal/inventory-read-only-portal-binding.ts",
  "app/portal/inventory/page.tsx",
  "app/portal/inventory/[workflow]/page.tsx"
].forEach(requireFile);

requireIncludes("lib/portal/inventory-read-only-portal-binding.ts", "phase: \"2K\"");
requireIncludes("lib/portal/inventory-read-only-portal-binding.ts", "InventoryPortalDemoUxStatus");
requireIncludes("lib/portal/inventory-read-only-portal-binding.ts", "demo_rows_visible");
requireIncludes("lib/portal/inventory-read-only-portal-binding.ts", "Seeded read-only demo rows are visible");
requireIncludes("lib/portal/inventory-read-only-portal-binding.ts", "No edit, upload, import, or stock-changing action is enabled");

requireIncludes("app/portal/inventory/page.tsx", "Read-only Demo UX QA");
requireIncludes("app/portal/inventory/page.tsx", "readOnlySummary.demoUxNote");
requireIncludes("app/portal/inventory/page.tsx", "table.demoUxLabel");
requireIncludes("app/portal/inventory/page.tsx", "table.demoUxNote");
requireIncludes("app/portal/inventory/page.tsx", "No edit or import controls are enabled");
requireIncludes("app/portal/inventory/[workflow]/page.tsx", "table.demoUxLabel");
requireIncludes("app/portal/inventory/[workflow]/page.tsx", "table.demoUxNote");

requireIncludes("app/globals.css", "Phase 2K — Read-only demo portal UX QA");
requireIncludes("app/globals.css", "demo-ux-review-note");
requireIncludes("docs/PORTAL_BUILD_PHASE2K_IMPLEMENTATION_REPORT.md", "Phase 2K — Inventory Read-only Demo Portal UX QA");
requireIncludes("docs/PORTAL_BUILD_PHASE2K_ACCEPTANCE_TESTS.md", "Portal Phase 2K verification passed.");
requireIncludes("docs/PORTAL_PHASE2K_DEMO_PORTAL_UX_QA_GUIDE.md", "no Create, Edit, Delete, Upload, Import Commit");
requireIncludes("docs/PORTAL_PHASE2K_DEMO_PORTAL_UX_MANIFEST.json", "\"writesEnabled\": false");
requireIncludes("docs/ROUTE_PROTECTION_MANIFEST.md", "Phase 2K Addendum — Inventory Read-only Demo Portal UX QA");

const packageJson = JSON.parse(read("package.json"));
if (packageJson.scripts?.["verify:portal-phase2k"] !== "node scripts/verify-portal-phase2k.mjs") failures.push("package.json missing verify:portal-phase2k script");

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
  console.error("Portal Phase 2K verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Portal Phase 2K verification passed.");
console.log("Phase 2K read-only demo portal UX QA checks passed.");
