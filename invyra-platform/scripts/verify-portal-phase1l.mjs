#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const requiredFiles = [
  "scripts/portal-runtime-results-report.mjs",
  "scripts/verify-portal-phase1l.mjs",
  "scripts/portal-runtime-smoke.mjs",
  "scripts/portal-smoke-results-review.mjs",
  "docs/PORTAL_BUILD_PHASE1L_IMPLEMENTATION_REPORT.md",
  "docs/PORTAL_BUILD_PHASE1L_ACCEPTANCE_TESTS.md",
  "docs/PORTAL_PHASE1L_LOCAL_RUNTIME_RESULTS_REVIEW_GUIDE.md",
  "docs/PORTAL_PHASE1L_RESULTS_REVIEW_CHECKLIST.md",
  "docs/PORTAL_PHASE1L_RESULTS_REVIEW_TEMPLATE.md",
  "docs/PORTAL_PHASE1L_LOCAL_RUNTIME_RESULTS_REVIEW.md",
  "docs/PORTAL_PHASE1J_SMOKE_TEST_RESULTS_TEMPLATE.json",
  "docs/ROUTE_PROTECTION_MANIFEST.md"
];

const checks = [];

function filePath(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(filePath(relativePath), "utf8");
}

function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

for (const file of requiredFiles) {
  check(`required file exists: ${file}`, fs.existsSync(filePath(file)));
}

const packageJson = JSON.parse(read("package.json"));
const reportScript = read("scripts/portal-runtime-results-report.mjs");
const guide = read("docs/PORTAL_PHASE1L_LOCAL_RUNTIME_RESULTS_REVIEW_GUIDE.md");
const checklist = read("docs/PORTAL_PHASE1L_RESULTS_REVIEW_CHECKLIST.md");
const template = read("docs/PORTAL_PHASE1L_RESULTS_REVIEW_TEMPLATE.md");
const implementationReport = read("docs/PORTAL_BUILD_PHASE1L_IMPLEMENTATION_REPORT.md");
const currentReview = read("docs/PORTAL_PHASE1L_LOCAL_RUNTIME_RESULTS_REVIEW.md");
const routeManifest = read("docs/ROUTE_PROTECTION_MANIFEST.md");

check(
  "package exposes Phase 1L verifier",
  packageJson.scripts?.["verify:portal-phase1l"] === "node scripts/verify-portal-phase1l.mjs"
);
check(
  "package exposes Phase 1L runtime results review",
  packageJson.scripts?.["review:portal-runtime-results"] === "node scripts/portal-runtime-results-report.mjs"
);
check("report script reads smoke results env path", reportScript.includes("INVYRA_PORTAL_SMOKE_RESULTS"));
check("report script writes Phase 1L review report", reportScript.includes("PORTAL_PHASE1L_LOCAL_RUNTIME_RESULTS_REVIEW.md"));
check("report script supports template not-run state", reportScript.includes("template-not-run") && reportScript.includes("NOT RUN"));
check("report script classifies failed checks", reportScript.includes("Missing route / route registration") && reportScript.includes("Visible page copy/content assertion"));
check("report script preserves no-backend boundary", reportScript.includes("Prisma writes") && reportScript.includes("Stock mutation"));
check("guide documents local runtime sequence", ["npm run dev", "npm run smoke:portal", "npm run review:portal-runtime-results"].every((token) => guide.includes(token)));
check("checklist covers route/content review", ["CRM page remains Future Module", "POS page remains Future Module", "Uploads remain disabled"].every((token) => checklist.includes(token)));
check("manual template supports lock decision", template.includes("Lock Decision") && template.includes("Requires Phase 1M bug fix pass"));
check("implementation report recommends Phase 1M", implementationReport.includes("Phase 1M — Inventory-first Portal Phase 1 Final Lock Report"));
check("generated current review records not-run state", currentReview.includes("Status: **NOT RUN**") && currentReview.includes("Run the local server"));
check("route manifest includes Phase 1L addendum", routeManifest.includes("Portal Build Development Phase 1L Addendum"));

const sampleResultsPath = filePath(".phase1l-sample-smoke-results.json");
const sampleReportPath = filePath(".phase1l-sample-review.md");
fs.writeFileSync(sampleResultsPath, `${JSON.stringify({
  phase: "Portal Phase 1J",
  target: "http://localhost:3000",
  generatedAt: "2026-06-11T00:00:00.000Z",
  summary: { total: 2, passed: 1, failed: 1 },
  checks: [
    { ok: true, name: "owner protected portal route loads", detail: "status 200, expected 200", route: "/portal/inventory" },
    { ok: false, name: "Inventory dashboard contains Inventory First", detail: "content missing", route: "/portal/inventory" }
  ]
}, null, 2)}\n`);

const run = spawnSync(process.execPath, ["scripts/portal-runtime-results-report.mjs"], {
  cwd: root,
  env: {
    ...process.env,
    INVYRA_PORTAL_SMOKE_RESULTS: sampleResultsPath,
    INVYRA_PORTAL_REVIEW_REPORT: sampleReportPath
  },
  encoding: "utf8"
});

const sampleReportExists = fs.existsSync(sampleReportPath);
const sampleReport = sampleReportExists ? fs.readFileSync(sampleReportPath, "utf8") : "";

check("sample Phase 1L report generation runs", run.status === 1, "expected non-zero because sample includes a failed check");
check("sample Phase 1L report file created", sampleReportExists);
check("sample Phase 1L report classifies content failure", sampleReport.includes("Visible page copy/content assertion"));
check("sample Phase 1L report includes decision guidance", sampleReport.includes("FAIL: fix the failing route/session/content issue"));

try { fs.unlinkSync(sampleResultsPath); } catch {}
try { fs.unlinkSync(sampleReportPath); } catch {}

const failed = checks.filter((entry) => !entry.ok);
if (failed.length > 0) {
  console.error(`\nPortal Phase 1L verification failed with ${failed.length} issue(s).`);
  process.exit(1);
}

console.log("\nPortal Phase 1L verification passed.");
console.log("Phase 1L runtime results review checks passed.");
