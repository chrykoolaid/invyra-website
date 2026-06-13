#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

const root = process.cwd();
const envOnly = process.argv.includes("--env-only");
const checks = [];

function record(ok, name, detail = "") { checks.push({ ok, name, detail }); }
function exists(relativePath) { return fs.existsSync(path.join(root, relativePath)); }
function read(relativePath) { return fs.readFileSync(path.join(root, relativePath), "utf8"); }
function semverMajor(version) { return Number(String(version).replace(/^v/, "").split(".")[0] || 0); }
function command(commandText) {
  try { return execSync(commandText, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch (error) { return ""; }
}

record(exists("package.json"), "package.json exists");
record(exists(".env.example"), ".env.example exists");
record(exists("prisma/schema.prisma"), "Prisma schema exists");
record(exists("prisma/seed.ts"), "Prisma seed exists");
record(exists("next.config.ts"), "Next config exists");
record(exists("tsconfig.json"), "TypeScript config exists");

const nodeVersion = process.version;
record(semverMajor(nodeVersion) >= 20, "Node.js major version is 20 or newer", nodeVersion);
const npmVersion = command("npm --version");
record(Boolean(npmVersion), "npm is available", npmVersion || "not found");
record(!npmVersion || semverMajor(npmVersion) >= 10, "npm major version is 10 or newer", npmVersion || "not found");

if (exists(".env.example")) {
  const env = read(".env.example");
  for (const key of ["DATABASE_URL", "SESSION_SECRET", "INVYRA_PLATFORM_ENV"]) {
    record(env.includes(key), `.env.example contains ${key}`);
  }
}

if (!envOnly && exists("package.json")) {
  const packageJson = JSON.parse(read("package.json"));
  const allDeps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
  for (const [name, version] of Object.entries(allDeps)) {
    record(version !== "latest", `dependency is pinned: ${name}`, String(version));
  }
  for (const script of ["doctor", "verify:phase1i", "prisma:generate", "prisma:migrate", "db:seed", "typecheck", "build", "dev"]) {
    record(Boolean(packageJson.scripts?.[script]), `script exists: ${script}`);
  }
}

const failed = checks.filter((check) => !check.ok);
console.log("\nInvyra Wave 5 Phase 1I local install doctor");
console.log("============================================");
for (const check of checks) console.log(`${check.ok ? "✅" : "❌"} ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
console.log("============================================");
console.log(`Passed: ${checks.length - failed.length}`);
console.log(`Failed: ${failed.length}`);

if (failed.length > 0) {
  console.log("\nNext safe fix path:");
  console.log("1. Confirm Node.js 20 LTS or newer is installed.");
  console.log("2. Copy .env.example to .env and fill DATABASE_URL + SESSION_SECRET.");
  console.log("3. Run npm install, then npm run prisma:generate.");
  process.exitCode = 1;
}
