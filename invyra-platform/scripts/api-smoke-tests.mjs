#!/usr/bin/env node
import process from "node:process";

const baseUrl = (process.env.INVYRA_PLATFORM_URL ?? "http://localhost:3000").replace(/\/$/, "");
const password = process.env.INVYRA_SEED_PASSWORD ?? "InvyraDemo#2026!";
const checks = [];

function record(ok, name, detail = "") {
  checks.push({ ok, name, detail });
  console.log(`${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
}

function cookieHeader(response) {
  const setCookie = response.headers.get("set-cookie") ?? "";
  return setCookie.split(",").map((part) => part.split(";")[0]).filter(Boolean).join("; ");
}

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...options,
    headers: {
      accept: "application/json",
      ...(options.headers ?? {})
    }
  });
}

async function expectStatus(name, path, expected, options = {}) {
  try {
    const response = await request(path, options);
    const ok = Array.isArray(expected) ? expected.includes(response.status) : response.status === expected;
    record(ok, name, `status ${response.status}, expected ${Array.isArray(expected) ? expected.join("/") : expected}`);
    return response;
  } catch (error) {
    record(false, name, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function login(identifier) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier, password })
  });

  let body = null;
  try { body = await response.json(); } catch {}

  const cookie = cookieHeader(response);
  const success = response.status === 200 && Boolean(cookie) && body?.ok === true;
  record(success, `login seeded user ${identifier}`, `status ${response.status}`);
  return { response, cookie, body };
}

console.log("\nInvyra Wave 5 Phase 1H API smoke tests");
console.log("======================================");
console.log(`Target: ${baseUrl}`);

await expectStatus("logged-out portal redirects to login", "/portal", [302, 303, 307, 308], { headers: { accept: "text/html" } });
await expectStatus("logged-out protected API is rejected", "/api/users", 401);
await expectStatus("public access request endpoint is reachable", "/api/onboarding/access-request", 405);

const owner = await login("owner@invyra.local");
const staff = await login("staff@invyra.local");

if (owner.cookie) {
  await expectStatus("owner can read auth session", "/api/auth/session", 200, { headers: { cookie: owner.cookie } });
  await expectStatus("owner can list users", "/api/users", 200, { headers: { cookie: owner.cookie } });
  await expectStatus("owner can read current environment", "/api/environments/current", 200, { headers: { cookie: owner.cookie } });
  await expectStatus("owner can read licensing", "/api/licensing", 200, { headers: { cookie: owner.cookie } });
  await expectStatus("owner can read devices", "/api/devices", 200, { headers: { cookie: owner.cookie } });
  await expectStatus("owner can read security audit", "/api/audit/security", 200, { headers: { cookie: owner.cookie } });
}

if (staff.cookie) {
  await expectStatus("staff cannot list admin users", "/api/users", 403, { headers: { cookie: staff.cookie } });
  await expectStatus("staff cannot read security audit", "/api/audit/security", 403, { headers: { cookie: staff.cookie } });
  await expectStatus("staff can read own auth session", "/api/auth/session", 200, { headers: { cookie: staff.cookie } });
}

const failed = checks.filter((check) => !check.ok);
console.log("======================================");
console.log(`Passed: ${checks.length - failed.length}`);
console.log(`Failed: ${failed.length}`);

if (failed.length > 0) {
  console.log("\nSmoke test failed. Confirm the local server is running, database is migrated, seed data exists, and INVYRA_SEED_PASSWORD matches the seeded password.");
  process.exitCode = 1;
}
