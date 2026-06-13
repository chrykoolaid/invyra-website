import fs from 'node:fs';
import path from 'node:path';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function assertContains(file, tokens) {
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) {
      throw new Error(`Missing required token in ${file}: ${token}`);
    }
  }
}

function assertNotContains(file, tokens) {
  const content = read(file);
  for (const token of tokens) {
    if (content.includes(token)) {
      throw new Error(`Forbidden token found in ${file}: ${token}`);
    }
  }
}

assertContains('package.json', ['"verify:portal-phase1i": "node scripts/verify-portal-phase1i.mjs"']);

assertContains('lib/security/access-control.ts', [
  'prisma.userPermissionOverride.findUnique',
  'userId_permissionId_organisationId',
  'USER_PERMISSION_OVERRIDE_DENIED',
  'userOverride?.allowed !== true',
  'LICENSE_ENTITLEMENT_MISSING'
]);

assertContains('lib/portal/portal-route-qa.ts', [
  'portalRouteGuardRegistry',
  'portalRouteQaRules',
  'canAccessModule must honour user permission overrides',
  'Roadmap modules must not deep-link into active Inventory workflow routes',
  'Future CRM and POS pages must remain session-protected'
]);

assertContains('app/portal/inventory/readiness/page.tsx', [
  'import { canAccessModule } from "@/lib/security/access-control";',
  'canAccessModule({ session, module: "INVENTORY", level: "VIEW" })',
  'if (!allowed) redirect("/access-denied")'
]);

assertContains('components/PortalShell.tsx', [
  'const futureNav: NavLink[] = getPortalModulesByGroup("future-module").map',
  'state: module.status === "future" ? "future" : "roadmap"',
  '...inventoryPortalWorkflows.map'
]);
assertNotContains('components/PortalShell.tsx', [
  '{ label: "Forecasting", href: "/portal/inventory/gap-scan", state: "roadmap" as const }'
]);

assertContains('lib/portal/module-catalog.ts', [
  'href: "/portal/roadmap/forecasting"',
  'href: "/portal/roadmap/purchasing-extensions"',
  'href: "/portal/roadmap/payroll"',
  'href: "/portal/roadmap/time-tracking"',
  'href: "/portal/roadmap/advanced-integrations"',
  'actionLabel: "View Roadmap"'
]);

assertContains('app/portal/roadmap/[module]/page.tsx', [
  'Roadmap Module',
  'generateStaticParams',
  'getPortalModulesByGroup("future-module")',
  'No operational Open button',
  'No fake backend data is shown.',
  'No live customer data mutation is possible from this page.'
]);
assertNotContains('app/portal/roadmap/[module]/page.tsx', [
  'canAccessModule({ session, module: "CRM"',
  'canAccessModule({ session, module: "POS"',
  'type="file"',
  '<form'
]);

assertContains('app/portal/page.tsx', [
  'visibility === "future" || visibility === "roadmap"',
  'View Roadmap'
]);

assertContains('docs/ROUTE_PROTECTION_MANIFEST.md', [
  'Portal Build Development Phase 1I Addendum',
  '/portal/roadmap/[module]',
  'now honours user permission overrides',
  'Roadmap modules no longer deep-link into active Inventory workflow routes'
]);

assertContains('docs/PORTAL_BUILD_PHASE1I_IMPLEMENTATION_REPORT.md', [
  'Phase 1I — Inventory Portal Route QA + Runtime Guard Review',
  'Status: COMPLETE',
  'Runtime Permission Override Alignment',
  'Phase 1J — Inventory Portal Runtime Smoke Test Pack + Local Verification Guide'
]);

assertContains('docs/PORTAL_BUILD_PHASE1I_ACCEPTANCE_TESTS.md', [
  'Portal Build Phase 1I — Acceptance Tests',
  'canAccessModule honours user permission overrides',
  'Roadmap modules do not link into active Inventory workflow routes'
]);

const catalog = read('lib/portal/module-catalog.ts');
const futureSection = catalog.slice(catalog.indexOf('id: "forecasting"'));
for (const forbidden of [
  'href: "/portal/inventory/gap-scan"',
  'href: "/portal/inventory/orders"',
  'actionLabel: "Roadmap Module"'
]) {
  if (futureSection.includes(forbidden)) {
    throw new Error(`Future module catalogue still contains active/dead roadmap token: ${forbidden}`);
  }
}

const allowedStaticRoutes = new Set([
  '/portal',
  '/portal/onboarding',
  '/portal/licensing',
  '/portal/devices',
  '/portal/crm',
  '/portal/pos',
  '/portal/admin/audit',
  '/portal/admin/environments',
  '/portal/admin/onboarding',
  '/portal/admin/organisation',
  '/portal/admin/qa',
  '/portal/admin/security',
  '/portal/admin/tenant-verification',
  '/portal/admin/users',
  '/portal/inventory',
  '/portal/inventory/readiness',
  '/portal/inventory/setup',
  '/portal/inventory/imports',
  '/portal/inventory/configuration'
]);

const inventoryDynamicSlugs = [
  'items',
  'movements',
  'suppliers',
  'orders',
  'receiving',
  'wastage',
  'store-use',
  'reorder-review',
  'gap-scan',
  'stocktake',
  'reports',
  'training-mode',
  'settings'
];
for (const slug of inventoryDynamicSlugs) allowedStaticRoutes.add(`/portal/inventory/${slug}`);

const roadmapSlugs = ['forecasting', 'purchasing-extensions', 'payroll', 'time-tracking', 'advanced-integrations'];
for (const slug of roadmapSlugs) allowedStaticRoutes.add(`/portal/roadmap/${slug}`);

const sourceFiles = [
  ...fs.readdirSync('app/portal', { recursive: true }).filter((file) => file.endsWith('.tsx')).map((file) => path.join('app/portal', file)),
  'components/PortalShell.tsx',
  'lib/portal/module-catalog.ts',
  'lib/portal/inventory-readiness.ts',
  'lib/portal/inventory-setup-actions.ts'
];

const routePattern = /href(?:=|:)\s*[{"'](\/portal[^"'}\s]*)["'}]/g;
const unknownRoutes = [];
for (const file of sourceFiles) {
  const content = read(file);
  for (const match of content.matchAll(routePattern)) {
    const route = match[1];
    if (!allowedStaticRoutes.has(route)) unknownRoutes.push(`${file}: ${route}`);
  }
}

if (unknownRoutes.length) {
  throw new Error(`Unknown /portal route references found:\n${unknownRoutes.join('\n')}`);
}

console.log('Portal Phase 1I verification passed.');
console.log('Phase 1I route QA and runtime guard checks passed.');
