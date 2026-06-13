import fs from 'node:fs';

const checks = [
  {
    file: 'lib/portal/inventory-setup-actions.ts',
    mustContain: [
      'InventorySetupAction',
      'InventoryImportTemplate',
      'buildInventorySetupActions',
      'getInventorySetupSummary',
      'inventoryImportTemplates',
      'Item Master Import',
      'Supplier Import',
      'Opening Stock Balance Import',
      'Reorder Level Import',
      'Supplier Item Mapping Import',
      'Uploads, parsing, and database writes remain disabled in Phase 1G'
    ]
  },
  {
    file: 'app/portal/inventory/setup/page.tsx',
    mustContain: [
      'Inventory Setup Actions',
      'Setup actions before live Inventory data',
      'buildInventorySetupActions',
      'Data Import Preparation',
      'No live uploads',
      'No stock mutation',
      'canAccessModule({ session, module: "INVENTORY", level: "VIEW" })'
    ],
    mustNotContain: [
      '<input type="file"',
      'onSubmit=',
      'form action='
    ]
  },
  {
    file: 'app/portal/inventory/imports/page.tsx',
    mustContain: [
      'Inventory Data Import Preparation',
      'File uploads are intentionally disabled',
      'inventoryImportTemplates',
      'inventoryImportStages',
      'No upload',
      'No parser',
      'No database writes',
      'No live stock mutation',
      'canAccessModule({ session, module: "INVENTORY", level: "VIEW" })'
    ],
    mustNotContain: [
      '<input type="file"',
      'onChange=',
      'uploadFile',
      'createMany',
      'prisma.item.create'
    ]
  },
  {
    file: 'components/PortalShell.tsx',
    mustContain: [
      'href: "/portal/inventory/setup"',
      'href: "/portal/inventory/imports"',
      'label: "Setup Actions"',
      'label: "Data Import Prep"'
    ]
  },
  {
    file: 'app/portal/inventory/page.tsx',
    mustContain: [
      'Open Setup Actions',
      'Open Import Preparation',
      'inventoryImportTemplates',
      'buildInventorySetupActions',
      'Template and validation planning only. Uploads and database writes are disabled.'
    ]
  },
  {
    file: 'app/portal/inventory/readiness/page.tsx',
    mustContain: [
      'Setup Actions',
      'Import Preparation',
      'Data import preparation: available, uploads disabled'
    ]
  },
  {
    file: 'app/portal/inventory/[workflow]/page.tsx',
    mustContain: [
      'Review Setup Actions',
      'Import Preparation',
      'Backend connection and import uploads remain deferred until scoped.'
    ]
  },
  {
    file: 'lib/portal/inventory-readiness.ts',
    mustContain: [
      'data-import-preparation',
      'Prepare data import templates',
      'Uploads, parsing, preview approval, and database writes are not enabled in this phase.'
    ]
  },
  {
    file: 'app/globals.css',
    mustContain: [
      'Portal Build Development Phase 1G',
      '.setup-action-board',
      '.setup-action-card',
      '.import-disabled-panel',
      '.import-template-card',
      '.setup-dependency-row'
    ]
  },
  {
    file: 'docs/ROUTE_PROTECTION_MANIFEST.md',
    mustContain: [
      'Portal Build Development Phase 1G Addendum',
      '/portal/inventory/setup',
      '/portal/inventory/imports',
      'lib/portal/inventory-setup-actions.ts',
      'Import uploads remain disabled'
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

const templateSource = fs.readFileSync('lib/portal/inventory-setup-actions.ts', 'utf8');
const requiredTemplateIds = ['id: "items"', 'id: "suppliers"', 'id: "opening-balances"', 'id: "reorder-levels"', 'id: "supplier-items"'];
for (const id of requiredTemplateIds) {
  if (!templateSource.includes(id)) {
    console.error(`Missing import template ${id}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('Portal Phase 1G verification passed.');
console.log('Phase 1G setup actions and import preparation checks passed.');
