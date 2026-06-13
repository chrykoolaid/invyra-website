import fs from 'node:fs';

const checks = [
  {
    file: 'lib/portal/inventory-admin-configuration.ts',
    mustContain: [
      'InventoryAdminConfigurationGroup',
      'inventoryAdminConfigurationGroups',
      'getInventoryAdminConfigurationSummary',
      'inventoryAdminConfigurationBoundaries',
      'Stock Rules',
      'Item Master Rules',
      'Supplier & Purchasing Rules',
      'Receiving & Discrepancy Rules',
      'Wastage & Store Use Rules',
      'Reorder Review & Gap Scan Rules',
      'Stocktake Rules',
      'Training Mode Rules',
      'Reporting & Export Rules',
      'Device & Scanner Rules',
      'No save buttons',
      'No database writes',
      'No live stock mutation'
    ]
  },
  {
    file: 'app/portal/inventory/configuration/page.tsx',
    mustContain: [
      'Inventory Admin Configuration Shell',
      'Prepare Inventory settings without enabling mutations',
      'canAccessModule({ session, module: "INVENTORY", level: "ADMINISTER" })',
      'inventoryAdminConfigurationGroups',
      'admin-config-board',
      'admin-config-disabled-control',
      'No save settings action',
      'No configuration form submission',
      'No Prisma configuration writes',
      'No live stock adjustment'
    ],
    mustNotContain: [
      '<form',
      '<input',
      'type="file"',
      'onSubmit=',
      'onChange=',
      'prisma.',
      'create(',
      'update(',
      'delete('
    ]
  },
  {
    file: 'components/PortalShell.tsx',
    mustContain: [
      'href: "/portal/inventory/configuration"',
      'label: "Admin Config"',
      'accessLevel: "ADMINISTER" as PermissionLevel',
      'inventoryAdminWorkflow'
    ]
  },
  {
    file: 'app/portal/inventory/page.tsx',
    mustContain: [
      'Admin Configuration Shell',
      'Open Admin Configuration',
      'getInventoryAdminConfigurationSummary',
      'inventoryAdminConfigurationGroups',
      'No save settings action',
      'No Prisma configuration writes'
    ]
  },
  {
    file: 'app/portal/inventory/[workflow]/page.tsx',
    mustContain: [
      'Admin Configuration',
      'Review Admin Configuration',
      'href="/portal/inventory/configuration"'
    ]
  },
  {
    file: 'lib/portal/inventory-setup-actions.ts',
    mustContain: [
      'prepare-admin-configuration',
      'Prepare admin configuration shell',
      'Open Admin Configuration',
      'No save buttons, forms, uploads, database writes, or live stock mutation are enabled in Phase 1H.'
    ]
  },
  {
    file: 'app/globals.css',
    mustContain: [
      'Portal Build Development Phase 1H',
      '.admin-config-hero-card',
      '.admin-config-boundary-panel',
      '.admin-config-board',
      '.admin-config-setting-row',
      '.admin-config-disabled-control'
    ]
  },
  {
    file: 'docs/ROUTE_PROTECTION_MANIFEST.md',
    mustContain: [
      'Portal Build Development Phase 1H Addendum',
      '/portal/inventory/configuration',
      'lib/portal/inventory-admin-configuration.ts',
      'canAccessModule({ module: "INVENTORY", level: "ADMINISTER" })',
      'configuration-shell only',
      'audit-logged'
    ]
  },
  {
    file: 'docs/PORTAL_BUILD_PHASE1H_IMPLEMENTATION_REPORT.md',
    mustContain: [
      'Phase 1H — Inventory Portal Admin Configuration Shell',
      'COMPLETE',
      'Protected /portal/inventory/configuration route',
      'No save settings',
      'Phase 1I — Inventory Portal Route QA + Runtime Guard Review'
    ]
  }
];

let failed = false;
for (const check of checks) {
  const content = fs.readFileSync(check.file, 'utf8');
  for (const token of check.mustContain ?? []) {
    if (!content.includes(token)) {
      console.error(`Missing required token in ${check.file}: ${token}`);
      failed = true;
    }
  }
  for (const token of check.mustNotContain ?? []) {
    if (content.includes(token)) {
      console.error(`Forbidden token found in ${check.file}: ${token}`);
      failed = true;
    }
  }
}

const adminSource = fs.readFileSync('lib/portal/inventory-admin-configuration.ts', 'utf8');
const requiredGroupIds = [
  'id: "stock-rules"',
  'id: "item-master"',
  'id: "supplier-purchasing"',
  'id: "receiving-discrepancy"',
  'id: "wastage-store-use"',
  'id: "replenishment-intelligence"',
  'id: "stocktake"',
  'id: "training-mode"',
  'id: "reporting-export"',
  'id: "device-scanner"'
];
for (const id of requiredGroupIds) {
  if (!adminSource.includes(id)) {
    console.error(`Missing admin configuration group ${id}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('Portal Phase 1H verification passed.');
console.log('Phase 1H admin configuration shell checks passed.');
