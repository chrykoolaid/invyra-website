#!/usr/bin/env node
import fs from "node:fs";

const inputPath = process.env.INVYRA_INVENTORY_DEMO_RUNTIME_RESULTS ?? "inventory-readonly-demo-runtime-results.json";
const outputPath = process.env.INVYRA_INVENTORY_DEMO_RUNTIME_REVIEW ?? "inventory-readonly-demo-runtime-review.json";
const markdownPath = process.env.INVYRA_INVENTORY_DEMO_RUNTIME_REVIEW_MD ?? "docs/PORTAL_PHASE2J_LOCAL_RUNTIME_RESULTS_REVIEW.md";

function classifyFailure(check) {
  const name = `${check.name ?? ""} ${check.detail ?? ""}`.toLowerCase();
  if (name.includes("login")) return "auth_or_seed_user";
  if (name.includes("locations") || name.includes("items") || name.includes("suppliers") || name.includes("stock balances") || name.includes("movements") || name.includes("configuration")) return "demo_seed_or_environment_scope";
  if (name.includes("write") || name.includes("upload") || name.includes("stock mutation")) return "read_only_boundary_regression";
  if (name.includes("json") || name.includes("status")) return "api_runtime_or_route_guard";
  return "manual_review_required";
}

function recommendedAction(classification) {
  if (classification === "auth_or_seed_user") return "Run npm run db:seed, confirm INVYRA_OWNER_LOGIN / INVYRA_SEED_PASSWORD, then rerun the smoke test.";
  if (classification === "demo_seed_or_environment_scope") return "Run npm run seed:inventory-readonly-demo and confirm the logged-in session environment matches the seeded environment being reviewed.";
  if (classification === "read_only_boundary_regression") return "Stop the release candidate and inspect Inventory API meta flags before continuing.";
  if (classification === "api_runtime_or_route_guard") return "Confirm the local Next.js server is running, migrations are applied, and route guards are not redirecting unexpectedly.";
  return "Review the failed check manually against the Phase 2J checklist.";
}

let result;
if (!fs.existsSync(inputPath)) {
  result = {
    phase: "Portal Phase 2J",
    status: "NOT_RUN",
    generatedAt: new Date().toISOString(),
    inputPath,
    decision: "No demo runtime smoke results were found. This is acceptable inside the packaged zip; run npm run smoke:inventory-demo-readonly locally after seeding demo data.",
    recommendedNextAction: "Run npm run db:seed, npm run seed:inventory-readonly-demo, npm run dev, then npm run smoke:inventory-demo-readonly."
  };
} else {
  const source = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const failedChecks = (source.checks ?? []).filter((check) => !check.ok);
  const classifications = failedChecks.map((check) => ({
    name: check.name,
    route: check.route,
    detail: check.detail,
    classification: classifyFailure(check),
    recommendedAction: recommendedAction(classifyFailure(check))
  }));
  result = {
    phase: "Portal Phase 2J",
    status: failedChecks.length === 0 ? "PASS" : "REVIEW_REQUIRED",
    generatedAt: new Date().toISOString(),
    inputPath,
    sourceSummary: source.summary,
    payloadSummary: source.payloadSummary,
    failedChecks: classifications,
    decision: failedChecks.length === 0
      ? "Read-only demo runtime results passed. Demo seed rows are visible through protected read-only APIs and mutation boundaries remain disabled."
      : "Read-only demo runtime results require review before Phase 2J can be locked."
  };
}

fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
const failed = result.failedChecks ?? [];
const lines = [
  "# Portal Phase 2J — Local Runtime Results Review",
  "",
  `Status: ${result.status}`,
  `Generated: ${result.generatedAt}`,
  "",
  `Decision: ${result.decision}`,
  "",
  "## Source Summary",
  "",
  result.sourceSummary ? `Total: ${result.sourceSummary.total} / Passed: ${result.sourceSummary.passed} / Failed: ${result.sourceSummary.failed}` : "No source smoke result file was available in this package.",
  "",
  "## Failed Checks",
  "",
  failed.length ? failed.map((failure) => `- ${failure.name} (${failure.route || "no route"}) — ${failure.classification}. ${failure.recommendedAction}`).join("\n") : "No failed checks recorded.",
  "",
  "## Boundary Reminder",
  "",
  "Phase 2J reviews read-only demo runtime results only. It does not enable uploads, CSV parsing, import commits, Prisma writes through the portal, stock mutation, CRM launch access, or POS launch access.",
  ""
];
fs.writeFileSync(markdownPath, `${lines.join("\n")}\n`);
console.log(`Inventory demo runtime review status: ${result.status}`);
console.log(`JSON review written: ${outputPath}`);
console.log(`Markdown review written: ${markdownPath}`);
if (result.status === "REVIEW_REQUIRED") process.exitCode = 1;
