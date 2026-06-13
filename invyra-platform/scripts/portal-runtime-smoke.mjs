#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";

const baseUrl = (process.env.INVYRA_PLATFORM_URL ?? "http://localhost:3000").replace(/\/$/, "");
const password = process.env.INVYRA_SEED_PASSWORD ?? "InvyraDemo#2026!";
const ownerIdentifier = process.env.INVYRA_OWNER_LOGIN ?? "owner@invyra.local";
const staffIdentifier = process.env.INVYRA_STAFF_LOGIN ?? "staff@invyra.local";
const includeStaff = process.env.INVYRA_PORTAL_SMOKE_INCLUDE_STAFF !== "false";
const outputPath = process.env.INVYRA_PORTAL_SMOKE_RESULTS ?? "portal-runtime-smoke-results.json";

const checks = [];

function record(ok, name, detail = "", route = "") {
  const check = { ok, name, detail, route };
  checks.push(check);
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

  return headers
    .map((part) => part.split(";")[0])
    .filter((part) => part.includes("="))
    .join("; ");
}

async function request(route, options = {}) {
  return fetch(`${baseUrl}${route}`, {
    redirect: "manual",
    ...options,
    headers: {
      accept: "text/html,application/json",
      ...(options.headers ?? {})
    }
  });
}

async function expectStatus(name, route, expected, options = {}) {
  try {
    const response = await request(route, options);
    const expectedStatuses = Array.isArray(expected) ? expected : [expected];
    const ok = expectedStatuses.includes(response.status);
    const location = response.headers.get("location");
    const detail = `status ${response.status}, expected ${expectedStatuses.join("/")}${location ? `, location ${location}` : ""}`;
    record(ok, name, detail, route);
    return response;
  } catch (error) {
    record(false, name, error instanceof Error ? error.message : String(error), route);
    return null;
  }
}

async function expectPageContains(name, route, cookie, tokens) {
  const response = await expectStatus(name, route, 200, { headers: { cookie } });
  if (!response || response.status !== 200) return;

  const body = await response.text();
  for (const token of tokens) {
    record(body.includes(token), `${name} contains ${token}`, body.includes(token) ? "content confirmed" : "content missing", route);
  }
}

async function login(label, identifier) {
  try {
    const response = await request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ identifier, password })
    });

    let body = null;
    try { body = await response.json(); } catch {}

    const cookie = cookieHeader(response);
    const ok = response.status === 200 && Boolean(cookie) && body?.ok === true;
    record(ok, `login ${label}`, `status ${response.status}`);
    return { response, cookie, body };
  } catch (error) {
    record(false, `login ${label}`, error instanceof Error ? error.message : String(error));
    return { response: null, cookie: "", body: null };
  }
}

const ownerRoutes = [
  "/portal",
  "/portal/inventory",
  "/portal/inventory/items",
  "/portal/inventory/movements",
  "/portal/inventory/suppliers",
  "/portal/inventory/orders",
  "/portal/inventory/receiving",
  "/portal/inventory/wastage",
  "/portal/inventory/store-use",
  "/portal/inventory/reorder-review",
  "/portal/inventory/gap-scan",
  "/portal/inventory/stocktake",
  "/portal/inventory/reports",
  "/portal/inventory/training-mode",
  "/portal/inventory/readiness",
  "/portal/inventory/setup",
  "/portal/inventory/imports",
  "/portal/inventory/configuration",
  "/portal/licensing",
  "/portal/crm",
  "/portal/pos",
  "/portal/roadmap/forecasting",
  "/portal/roadmap/purchasing-extensions",
  "/portal/roadmap/payroll",
  "/portal/roadmap/time-tracking",
  "/portal/roadmap/advanced-integrations"
];

console.log("\nInvyra Portal Phase 1J runtime smoke tests");
console.log("==========================================");
console.log(`Target: ${baseUrl}`);

await expectStatus("logged-out portal redirects to login", "/portal", [302, 303, 307, 308], { headers: { accept: "text/html" } });
await expectStatus("logged-out Inventory redirects to login", "/portal/inventory", [302, 303, 307, 308], { headers: { accept: "text/html" } });
await expectStatus("logged-out Inventory admin config redirects to login", "/portal/inventory/configuration", [302, 303, 307, 308], { headers: { accept: "text/html" } });

const owner = await login("owner", ownerIdentifier);

if (owner.cookie) {
  for (const route of ownerRoutes) {
    await expectStatus("owner protected portal route loads", route, 200, { headers: { cookie: owner.cookie } });
  }

  await expectPageContains("Inventory dashboard", "/portal/inventory", owner.cookie, ["Inventory Dashboard", "Inventory First", "Not Connected"]);
  await expectPageContains("Inventory items workflow", "/portal/inventory/items", owner.cookie, ["Items", "Backend Contract Needed", "No live workflow data"]);
  await expectPageContains("Inventory readiness", "/portal/inventory/readiness", owner.cookie, ["Inventory Readiness", "backend", "LIVE"]);
  await expectPageContains("Inventory imports", "/portal/inventory/imports", owner.cookie, ["Data Import", "Uploads remain disabled", "No database writes"]);
  await expectPageContains("Inventory configuration", "/portal/inventory/configuration", owner.cookie, ["Admin Configuration", "disabled", "does not save settings"]);
  await expectPageContains("CRM future page", "/portal/crm", owner.cookie, ["Future Module", "Coming Later", "No Launch"]);
  await expectPageContains("POS future page", "/portal/pos", owner.cookie, ["Future Module", "Coming Later", "No Launch"]);
  await expectPageContains("Forecasting roadmap page", "/portal/roadmap/forecasting", owner.cookie, ["Roadmap Module", "Inventory First", "No Launch"]);
}

if (includeStaff) {
  const staff = await login("staff", staffIdentifier);
  if (staff.cookie) {
    await expectStatus("staff can reach Inventory portal or is correctly denied by role/licence", "/portal/inventory", [200, 302, 303, 307, 308, 403], { headers: { cookie: staff.cookie } });
    await expectStatus("staff cannot normally access Inventory admin configuration", "/portal/inventory/configuration", [302, 303, 307, 308, 403], { headers: { cookie: staff.cookie } });
    await expectStatus("staff can view future CRM info or is redirected by session policy", "/portal/crm", [200, 302, 303, 307, 308], { headers: { cookie: staff.cookie } });
  }
}

const failed = checks.filter((check) => !check.ok);
const result = {
  phase: "Portal Phase 1J",
  target: baseUrl,
  generatedAt: new Date().toISOString(),
  summary: {
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length
  },
  checks
};

fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);

console.log("==========================================");
console.log(`Passed: ${result.summary.passed}`);
console.log(`Failed: ${result.summary.failed}`);
console.log(`Results written: ${outputPath}`);

if (failed.length > 0) {
  console.log("\nPortal runtime smoke test failed. Confirm the local server is running, seed data exists, the database is migrated, and INVYRA_SEED_PASSWORD matches the seeded password.");
  process.exitCode = 1;
}
