#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const inputPath = path.resolve(root, process.env.INVYRA_PORTAL_SMOKE_RESULTS ?? "portal-runtime-smoke-results.json");
const templatePath = path.join(root, "docs", "PORTAL_PHASE1J_SMOKE_TEST_RESULTS_TEMPLATE.json");
const outputPath = path.resolve(root, process.env.INVYRA_PORTAL_REVIEW_REPORT ?? "docs/PORTAL_PHASE1L_LOCAL_RUNTIME_RESULTS_REVIEW.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function relative(filePath) {
  return path.relative(root, filePath) || filePath;
}

function escapeTable(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .trim();
}

function classify(check) {
  const name = String(check?.name ?? "").toLowerCase();
  const detail = String(check?.detail ?? "").toLowerCase();
  const route = String(check?.route ?? "").toLowerCase();

  if (detail.includes("status 404")) return "Missing route / route registration";
  if (detail.includes("status 500")) return "Runtime render/server error";
  if (detail.includes("status 401")) return "Authentication/session failure";
  if (detail.includes("status 403")) return "Permission or entitlement guard";
  if (detail.includes("location") && detail.includes("login")) return "Unexpected login redirect/session state";
  if (detail.includes("content missing")) return "Visible page copy/content assertion";
  if (name.includes("login")) return "Authentication or seed account";
  if (route.includes("configuration")) return "Inventory admin route/permission";
  if (route.includes("crm") || route.includes("pos") || route.includes("roadmap")) return "Future module route boundary";
  if (route.includes("inventory")) return "Inventory portal route";
  return "General smoke-test failure";
}

function recommendedAction(category) {
  const actions = {
    "Missing route / route registration": "Confirm the route file exists under app/portal and that dynamic route slugs match the smoke manifest.",
    "Runtime render/server error": "Open the local terminal error stack, fix the TSX/server component failure, then rerun npm run smoke:portal.",
    "Authentication/session failure": "Confirm the database is migrated/seeded and INVYRA_SEED_PASSWORD plus login identifiers match prisma/seed.ts.",
    "Permission or entitlement guard": "Confirm seeded licence entitlements, role permissions, and user permission overrides match the expected portal access model.",
    "Unexpected login redirect/session state": "Confirm cookie handling, session creation, NEXTAUTH/app secret configuration if present, and local browser/server host consistency.",
    "Visible page copy/content assertion": "Open the route locally and align either the visible boundary text or the smoke token if the page copy changed intentionally.",
    "Inventory admin route/permission": "Confirm /portal/inventory/configuration remains admin-only and that non-admin access is restricted intentionally.",
    "Future module route boundary": "Confirm CRM/POS/roadmap pages remain information-only and do not expose Open, Launch, or operational actions.",
    "Inventory portal route": "Confirm the Inventory licence, INVENTORY.VIEW guard, and workflow-specific access level for this route.",
    "General smoke-test failure": "Review the smoke-test detail, reproduce the route locally, and decide whether this is a route bug, seed-data issue, or test expectation mismatch."
  };
  return actions[category] ?? actions["General smoke-test failure"];
}

function routeSummary(checks) {
  const grouped = new Map();
  for (const check of checks) {
    const key = check.route || "general";
    if (!grouped.has(key)) grouped.set(key, { total: 0, passed: 0, failed: 0 });
    const entry = grouped.get(key);
    entry.total += 1;
    if (check.ok === false) entry.failed += 1;
    if (check.ok === true) entry.passed += 1;
  }
  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function loadResults() {
  if (fs.existsSync(inputPath)) {
    return { data: readJson(inputPath), source: inputPath, sourceKind: "runtime-results" };
  }
  if (fs.existsSync(templatePath)) {
    return { data: readJson(templatePath), source: templatePath, sourceKind: "template-not-run" };
  }
  throw new Error("No portal smoke results or Phase 1J smoke template found.");
}

function buildMarkdown({ data, source, sourceKind }) {
  const checks = Array.isArray(data.checks) ? data.checks : [];
  const failed = checks.filter((check) => check.ok === false);
  const passed = checks.filter((check) => check.ok === true);
  const notRun = checks.filter((check) => check.ok !== true && check.ok !== false);
  const status = sourceKind === "template-not-run"
    ? "NOT RUN"
    : failed.length === 0
      ? "PASS"
      : "FAIL";

  const categories = new Map();
  for (const check of failed) {
    const category = classify(check);
    if (!categories.has(category)) categories.set(category, []);
    categories.get(category).push(check);
  }

  const lines = [];
  lines.push("# 🔒 INVYRA PORTAL PHASE 1L — LOCAL RUNTIME RESULTS REVIEW");
  lines.push("");
  lines.push("## Review Status");
  lines.push("");
  lines.push(`Status: **${status}**`);
  lines.push(`Source: \`${relative(source)}\``);
  lines.push(`Phase recorded by results file: \`${data.phase ?? "unknown"}\``);
  lines.push(`Target: \`${data.target ?? "not recorded"}\``);
  lines.push(`Generated at: \`${data.generatedAt ?? "not recorded"}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Count |");
  lines.push("|---|---:|");
  lines.push(`| Total checks | ${checks.length} |`);
  lines.push(`| Passed checks | ${passed.length} |`);
  lines.push(`| Failed checks | ${failed.length} |`);
  lines.push(`| Not-run/template checks | ${notRun.length} |`);
  lines.push("");

  if (sourceKind === "template-not-run") {
    lines.push("## Runtime Results Not Available Yet");
    lines.push("");
    lines.push("No `portal-runtime-smoke-results.json` file was found. This report was generated from the Phase 1J template only.");
    lines.push("");
    lines.push("Run the local server, execute `npm run smoke:portal`, then rerun `npm run review:portal-runtime-results` to generate a real Phase 1L review.");
    lines.push("");
  }

  lines.push("## Failed Checks");
  lines.push("");
  if (failed.length === 0) {
    lines.push("No failed runtime checks were found in the available results.");
  } else {
    lines.push("| Route | Check | Detail | Classification |");
    lines.push("|---|---|---|---|");
    for (const check of failed) {
      lines.push(`| ${escapeTable(check.route || "general")} | ${escapeTable(check.name)} | ${escapeTable(check.detail)} | ${escapeTable(classify(check))} |`);
    }
  }
  lines.push("");

  lines.push("## Failure Triage");
  lines.push("");
  if (categories.size === 0) {
    lines.push("No failure triage is required based on the available results.");
  } else {
    for (const [category, categoryChecks] of categories.entries()) {
      lines.push(`### ${category}`);
      lines.push("");
      lines.push(`Affected checks: ${categoryChecks.length}`);
      lines.push("");
      lines.push(`Recommended action: ${recommendedAction(category)}`);
      lines.push("");
    }
  }

  lines.push("## Route Summary");
  lines.push("");
  lines.push("| Route | Passed | Failed | Total |");
  lines.push("|---|---:|---:|---:|");
  for (const [route, summary] of routeSummary(checks)) {
    lines.push(`| ${escapeTable(route)} | ${summary.passed} | ${summary.failed} | ${summary.total} |`);
  }
  lines.push("");

  lines.push("## Decision Guidance");
  lines.push("");
  lines.push("Use this review to decide the next safe action:");
  lines.push("");
  lines.push("```text");
  lines.push("PASS + real runtime results: Phase 1L can be locked.");
  lines.push("NOT RUN: do not lock runtime readiness yet; run local smoke tests first.");
  lines.push("FAIL: fix the failing route/session/content issue before Inventory backend integration.");
  lines.push("```");
  lines.push("");

  lines.push("## Boundary Check");
  lines.push("");
  lines.push("Phase 1L is QA/review-only and must not introduce:");
  lines.push("");
  lines.push("```text");
  lines.push("Uploads");
  lines.push("CSV parsing");
  lines.push("Prisma writes");
  lines.push("Stock mutation");
  lines.push("Supplier creation");
  lines.push("Purchase order mutation");
  lines.push("Receiving mutation");
  lines.push("CRM operational launch");
  lines.push("POS operational launch");
  lines.push("Billing/payment processing");
  lines.push("```");
  lines.push("");

  return { markdown: `${lines.join("\n")}\n`, status, failedCount: failed.length, sourceKind };
}

try {
  const loaded = loadResults();
  const result = buildMarkdown(loaded);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, result.markdown);

  console.log("Invyra Portal Phase 1L runtime results review");
  console.log("===============================================");
  console.log(`Status: ${result.status}`);
  console.log(`Source: ${relative(loaded.source)}`);
  console.log(`Report: ${relative(outputPath)}`);
  console.log(`Failed checks: ${result.failedCount}`);

  if (result.sourceKind === "runtime-results" && result.failedCount > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
