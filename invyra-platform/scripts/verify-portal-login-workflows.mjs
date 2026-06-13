
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const repoRoot = path.resolve(root, "..");
const failures = [];

function mustExist(relativePath) {
  const full = path.resolve(root, relativePath);
  if (!fs.existsSync(full)) failures.push(`Missing ${relativePath}`);
}
function mustInclude(relativePath, snippets) {
  const full = path.resolve(root, relativePath);
  if (!fs.existsSync(full)) {
    failures.push(`Missing ${relativePath}`);
    return;
  }
  const text = fs.readFileSync(full, "utf8");
  for (const snippet of snippets) {
    if (!text.includes(snippet)) failures.push(`${relativePath} missing required text: ${snippet}`);
  }
}
function mustIncludeStatic(relativePath, snippets) {
  const full = path.resolve(repoRoot, relativePath);
  if (!fs.existsSync(full)) {
    failures.push(`Missing static ${relativePath}`);
    return;
  }
  const text = fs.readFileSync(full, "utf8");
  for (const snippet of snippets) {
    if (!text.includes(snippet)) failures.push(`static ${relativePath} missing required text: ${snippet}`);
  }
}

[
  "app/login/page.tsx",
  "app/forgot-password/page.tsx",
  "app/reset-password/page.tsx",
  "app/activate/page.tsx",
  "app/api/auth/login/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/auth/forgot-password/route.ts",
  "app/api/auth/reset-password/route.ts",
  "app/api/auth/session/route.ts",
  "middleware.ts"
].forEach(mustExist);

mustInclude("middleware.ts", ["pathname.startsWith(\"/portal\")", "NextResponse.redirect(loginUrl)"]);
mustInclude("app/login/page.tsx", ["Sign in to your Inventory workspace", "organisation membership", "Inventory licence", "Activate a device"]);
mustInclude("app/forgot-password/page.tsx", ["Reset your Inventory portal password", "Request reset"]);
mustInclude("app/reset-password/page.tsx", ["Choose a new portal password", "minLength={12}"]);
mustIncludeStatic("portal/index.html", ["Secure Inventory portal", "Open Inventory Portal Login", "Forgot password", "Activate device", "Access gates", "Inventory Dashboard"]);
mustIncludeStatic("app/index.html", ["Sign in to Invyra Inventory", "Login → Organisation → Licence → Device → Environment → Inventory"]);
mustIncludeStatic("app/dashboard.html", ["Operational portal workspace", "Sprint 8", "Sprint 9"]);
mustIncludeStatic("app/forgot-password.html", ["Recover portal access", "Token generated"]);
mustIncludeStatic("app/reset.html", ["Choose a new password", "Minimum 12 characters"]);
mustIncludeStatic("app/device-activation.html", ["Activate the workstation or scanner", "Device gate"]);
mustIncludeStatic("app/request-access.html", ["Start the Inventory portal path", "Request Inventory Access"]);

if (failures.length) {
  console.error("Portal login workflow verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Portal login workflow verification passed. Public portal, static app preview, protected Next routes, auth APIs, and middleware are present.");
