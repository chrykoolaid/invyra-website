#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const resultsPath = path.join(root, process.env.INVYRA_PORTAL_SMOKE_RESULTS ?? "portal-runtime-smoke-results.json");
const templatePath = path.join(root, "docs", "PORTAL_PHASE1J_SMOKE_TEST_RESULTS_TEMPLATE.json");

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${path.relative(root, filePath)} is not valid JSON: ${error.message}`);
  }
}

function icon(ok) {
  if (ok === true) return "✅";
  if (ok === false) return "❌";
  return "⚪";
}

function review(data, sourceLabel) {
  console.log("\nInvyra Portal Phase 1J smoke results review");
  console.log("============================================");
  console.log(`Source: ${sourceLabel}`);
  console.log(`Phase: ${data.phase ?? "unknown"}`);
  console.log(`Target: ${data.target ?? "not recorded"}`);

  const checks = Array.isArray(data.checks) ? data.checks : [];
  const failed = checks.filter((check) => check.ok === false);
  const grouped = new Map();
  for (const check of checks) {
    const key = check.route || "general";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(check);
  }

  for (const [route, routeChecks] of grouped.entries()) {
    const routeFailed = routeChecks.some((check) => check.ok === false);
    console.log(`${icon(!routeFailed)} ${route}`);
    for (const check of routeChecks) {
      console.log(`   ${icon(check.ok)} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
    }
  }

  console.log("============================================");
  console.log(`Total checks: ${checks.length}`);
  console.log(`Failed checks: ${failed.length}`);

  if (failed.length > 0) process.exitCode = 1;
}

if (fs.existsSync(resultsPath)) {
  review(readJson(resultsPath), path.relative(root, resultsPath));
} else if (fs.existsSync(templatePath)) {
  console.log("No portal-runtime-smoke-results.json found. Showing the Phase 1J template instead.");
  console.log("Run npm run smoke:portal after starting the local server to create real results.");
  review(readJson(templatePath), path.relative(root, templatePath));
} else {
  console.error("No portal smoke results or template found.");
  process.exit(1);
}
