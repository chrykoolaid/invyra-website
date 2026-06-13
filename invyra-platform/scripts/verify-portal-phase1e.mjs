import fs from 'node:fs';

const checks = [
  {
    file: 'lib/portal/inventory-workflow-layouts.ts',
    mustContain: [
      'InventoryWorkflowLayout',
      'inventoryWorkflowLayouts',
      'getInventoryWorkflowLayout',
      'Item Master Workspace',
      'Purchase Order Command Workspace',
      'Receiving Workspace',
      'Gap Scan Workspace',
      'Stocktake Workspace',
      'Inventory Reports Workspace',
      'Training Workspace',
      'Inventory Admin Workspace',
      'No fake backend claim'
    ]
  },
  {
    file: 'app/portal/inventory/[workflow]/page.tsx',
    mustContain: [
      'getInventoryWorkflowLayout(workflow.id)',
      'Inventory Workflow Detail Layout',
      'workflow-layout-shell',
      'workflow-column-preview',
      'workflow-empty-state-panel',
      'workflow-disabled-action',
      'Backend Contract Needed',
      'Safety Rules',
      'No live workflow data or fake rows are shown'
    ]
  },
  {
    file: 'app/portal/inventory/page.tsx',
    mustContain: [
      'Open Detail Layout',
      'Protected workflow detail layouts are now prepared',
      'Workflow detail layouts: active'
    ]
  },
  {
    file: 'app/globals.css',
    mustContain: [
      'Portal Build Development Phase 1E',
      '.workflow-layout-shell',
      '.workflow-layout-grid',
      '.workflow-column-preview',
      '.workflow-empty-state-panel',
      '.workflow-disabled-action'
    ]
  },
  {
    file: 'docs/ROUTE_PROTECTION_MANIFEST.md',
    mustContain: [
      'Portal Build Development Phase 1E Addendum',
      'workflow-specific detail layouts',
      'lib/portal/inventory-workflow-layouts.ts',
      'No fake operational data'
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
}

const layoutContent = fs.readFileSync('lib/portal/inventory-workflow-layouts.ts', 'utf8');
const requiredWorkflowIds = [
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
  'inventory-settings'
];
for (const id of requiredWorkflowIds) {
  if (!layoutContent.includes(`workflowId: "${id}"`)) {
    console.error(`Missing workflow-specific layout metadata for ${id}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('Portal Phase 1E verification passed.');
