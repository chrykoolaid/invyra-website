#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";

const baseUrl = (process.env.INVYRA_PLATFORM_URL ?? "http://localhost:3000").replace(/\/$/, "");
const password = process.env.INVYRA_SEED_PASSWORD ?? "InvyraDemo#2026!";
const ownerIdentifier = process.env.INVYRA_OWNER_LOGIN ?? "owner@invyra.local";
const outputPath = process.env.INVYRA_INVENTORY_API_SMOKE_RESULTS ?? "inventory-readonly-api-smoke-results.json";
const checks = [];

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
    record(ok, "owner login for Inventory API smoke", `status ${response.status}`);
    return cookie;
  } catch (error) {
    record(false, "owner login for Inventory API smoke", error instanceof Error ? error.message : String(error));
    return "";
  }
}

async function expectLoggedOutProtected(route) {
  try {
    const response = await request(route);
    const ok = [302, 303, 307, 308, 401, 403].includes(response.status);
    record(ok, "logged-out Inventory API is protected", `status ${response.status}`, route);
  } catch (error) {
    record(false, "logged-out Inventory API is protected", error instanceof Error ? error.message : String(error), route);
  }
}

async function expectJson(route, cookie, requiredTokens = []) {
  try {
    const response = await request(route, { headers: { cookie } });
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    const okStatus = response.status === 200;
    const okJson = Boolean(json) && typeof json === "object";
    record(okStatus && okJson, "owner Inventory API returns JSON", `status ${response.status}`, route);
    for (const token of requiredTokens) {
      record(text.includes(token), `Inventory API payload includes ${token}`, text.includes(token) ? "token confirmed" : "token missing", route);
    }
  } catch (error) {
    record(false, "owner Inventory API returns JSON", error instanceof Error ? error.message : String(error), route);
  }
}

async function expectPostNotEnabled(route, cookie) {
  try {
    const response = await request(route, {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ unsafe: true })
    });
    const ok = [302, 303, 307, 308, 400, 401, 403, 404, 405].includes(response.status);
    record(ok, "POST remains not enabled on read-only Inventory API", `status ${response.status}`, route);
  } catch (error) {
    record(false, "POST remains not enabled on read-only Inventory API", error instanceof Error ? error.message : String(error), route);
  }
}

console.log("\nInvyra Inventory Phase 2H read-only API smoke tests");
console.log("====================================================");
console.log(`Target: ${baseUrl}`);

const routes = [
  ["/api/inventory/readiness", ["read", "writeEnabled"]],
  ["/api/inventory/items", ["items", "writeEnabled"]],
  ["/api/inventory/suppliers", ["suppliers", "writeEnabled"]],
  ["/api/inventory/movements", ["movements", "writeEnabled"]],
  ["/api/inventory/configuration", ["configuration", "writeEnabled"]]
];

await expectLoggedOutProtected("/api/inventory/items");
const cookie = await login();
if (cookie) {
  for (const [route, tokens] of routes) {
    await expectJson(route, cookie, tokens);
    await expectPostNotEnabled(route, cookie);
  }
}

const failed = checks.filter((check) => !check.ok);
const result = {
  phase: "Portal Phase 2H",
  target: baseUrl,
  generatedAt: new Date().toISOString(),
  summary: { total: checks.length, passed: checks.length - failed.length, failed: failed.length },
  checks
};
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log("====================================================");
console.log(`Passed: ${result.summary.passed}`);
console.log(`Failed: ${result.summary.failed}`);
console.log(`Results written: ${outputPath}`);
if (failed.length > 0) process.exitCode = 1;
