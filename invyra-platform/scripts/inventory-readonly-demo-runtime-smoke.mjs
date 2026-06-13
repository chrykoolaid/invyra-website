#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";

const baseUrl = (process.env.INVYRA_PLATFORM_URL ?? "http://localhost:3000").replace(/\/$/, "");
const password = process.env.INVYRA_SEED_PASSWORD ?? "InvyraDemo#2026!";
const ownerIdentifier = process.env.INVYRA_OWNER_LOGIN ?? "owner@invyra.local";
const outputPath = process.env.INVYRA_INVENTORY_DEMO_RUNTIME_RESULTS ?? "inventory-readonly-demo-runtime-results.json";
const checks = [];
const payloads = {};

function record(ok, name, detail = "", route = "") {
  checks.push({ ok, name, detail, route });
  console.log(`${ok ? "✅" : "❌"} ${name}${route ? ` [${route}]` : ""}${detail ? ` — ${detail}` : ""}`);
}

function splitSetCookieHeader(setCookieHeader) {
  if (!setCookieHeader) return [];
  return setCookieHeader.split(/,(?=\s*[^;,=]+=[^;,]*)/g).map((part) => part.trim()).filter(Boolean);
}

function cookieHeader(response) {
  const headers = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : splitSetCookieHeader(response.headers.get("set-cookie") ?? "");

  return headers.map((part) => part.split(";")[0]).filter((part) => part.includes("=")).join("; ");
}

async function request(route, options = {}) {
  return fetch(`${baseUrl}${route}`, {
    redirect: "manual",
    ...options,
    headers: {
      accept: "application/json,text/html",
      ...(options.headers ?? {})
    }
  });
}

async function login() {
  try {
    const response = await request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ identifier: ownerIdentifier, password })
    });
    let body = null;
    try { body = await response.json(); } catch {}
    const cookie = cookieHeader(response);
    const ok = response.status === 200 && Boolean(cookie) && body?.ok === true;
    record(ok, "owner login for Inventory demo runtime smoke", `status ${response.status}`);
    return cookie;
  } catch (error) {
    record(false, "owner login for Inventory demo runtime smoke", error instanceof Error ? error.message : String(error));
    return "";
  }
}

async function readJson(route, cookie) {
  try {
    const response = await request(route, { headers: { cookie } });
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    const ok = response.status === 200 && Boolean(json) && typeof json === "object";
    record(ok, "read-only demo API returns JSON", `status ${response.status}`, route);
    if (ok) payloads[route] = json;
    return json;
  } catch (error) {
    record(false, "read-only demo API returns JSON", error instanceof Error ? error.message : String(error), route);
    return null;
  }
}

function expect(condition, name, detail = "", route = "") {
  record(Boolean(condition), name, detail, route);
}

function count(records) {
  return Array.isArray(records) ? records.length : 0;
}

console.log("\nInvyra Inventory Phase 2J read-only demo runtime smoke");
console.log("======================================================");
console.log(`Target: ${baseUrl}`);
console.log("Expected prerequisite: npm run db:seed && npm run seed:inventory-readonly-demo");

const cookie = await login();
if (cookie) {
  const readiness = await readJson("/api/inventory/readiness", cookie);
  const items = await readJson("/api/inventory/items", cookie);
  const suppliers = await readJson("/api/inventory/suppliers", cookie);
  const movements = await readJson("/api/inventory/movements", cookie);
  const configuration = await readJson("/api/inventory/configuration", cookie);

  const counts = readiness?.readiness?.counts ?? {};
  expect(counts.locations >= 2, "demo readiness includes at least two locations", `locations ${counts.locations ?? "missing"}`, "/api/inventory/readiness");
  expect(counts.items >= 3, "demo readiness includes at least three items", `items ${counts.items ?? "missing"}`, "/api/inventory/readiness");
  expect(counts.suppliers >= 2, "demo readiness includes at least two suppliers", `suppliers ${counts.suppliers ?? "missing"}`, "/api/inventory/readiness");
  expect(counts.stockBalances >= 3, "demo readiness includes at least three stock balances", `stockBalances ${counts.stockBalances ?? "missing"}`, "/api/inventory/readiness");
  expect(counts.movements >= 3, "demo readiness includes at least three movements", `movements ${counts.movements ?? "missing"}`, "/api/inventory/readiness");
  expect(counts.configurations >= 1, "demo readiness includes configuration row", `configurations ${counts.configurations ?? "missing"}`, "/api/inventory/readiness");

  const itemRows = items?.records ?? [];
  expect(count(itemRows) >= 3, "demo items are visible through read-only API", `records ${count(itemRows)}`, "/api/inventory/items");
  expect(itemRows.some((item) => String(item.sku ?? "").includes("INV-DEMO-LAUNDRY-BAGS")), "demo item Laundry Bags present", "SKU token confirmed", "/api/inventory/items");
  expect(itemRows.some((item) => String(item.sku ?? "").includes("INV-DEMO-DETERGENT")), "demo item Laundry Detergent present", "SKU token confirmed", "/api/inventory/items");
  expect(itemRows.some((item) => String(item.sku ?? "").includes("INV-DEMO-HANGERS")), "demo item Hangers present", "SKU token confirmed", "/api/inventory/items");

  const supplierRows = suppliers?.records ?? [];
  expect(count(supplierRows) >= 2, "demo suppliers are visible through read-only API", `records ${count(supplierRows)}`, "/api/inventory/suppliers");
  expect(supplierRows.some((supplier) => supplier.name === "CleanPro Supplies"), "demo supplier CleanPro present", "name confirmed", "/api/inventory/suppliers");
  expect(supplierRows.some((supplier) => supplier.name === "Packline Wholesale"), "demo supplier Packline present", "name confirmed", "/api/inventory/suppliers");

  const movementRows = movements?.records ?? [];
  expect(count(movementRows) >= 3, "demo movements are visible through read-only API", `records ${count(movementRows)}`, "/api/inventory/movements");
  expect(movementRows.some((movement) => movement.referenceId === "PHASE2I"), "demo movement PHASE2I reference present", "reference confirmed", "/api/inventory/movements");

  const configurationRows = configuration?.records ?? [];
  expect(configurationRows.some((row) => row.key === "demo.readOnlyPortalValidation"), "demo read-only configuration present", "configuration key confirmed", "/api/inventory/configuration");

  for (const [route, payload] of Object.entries(payloads)) {
    expect(payload?.meta?.writeEnabled === false, "write boundary remains disabled", "writeEnabled false", route);
    expect(payload?.meta?.uploadsEnabled === false, "upload boundary remains disabled", "uploadsEnabled false", route);
    expect(payload?.meta?.stockMutationEnabled === false, "stock mutation boundary remains disabled", "stockMutationEnabled false", route);
  }
}

const failed = checks.filter((check) => !check.ok);
const result = {
  phase: "Portal Phase 2J",
  target: baseUrl,
  generatedAt: new Date().toISOString(),
  prerequisite: "Run npm run db:seed and npm run seed:inventory-readonly-demo before this smoke test.",
  summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
  checks,
  payloadSummary: Object.fromEntries(Object.entries(payloads).map(([route, payload]) => [route, {
    records: Array.isArray(payload?.records) ? payload.records.length : undefined,
    counts: payload?.readiness?.counts,
    writeEnabled: payload?.meta?.writeEnabled,
    uploadsEnabled: payload?.meta?.uploadsEnabled,
    stockMutationEnabled: payload?.meta?.stockMutationEnabled
  }]))
};
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log("======================================================");
console.log(`Passed: ${result.summary.passed}`);
console.log(`Failed: ${result.summary.failed}`);
console.log(`Results written: ${outputPath}`);
if (failed.length > 0) process.exitCode = 1;
