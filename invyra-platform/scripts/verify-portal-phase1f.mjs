import fs from 'node:fs';

const checks = [
  {
    file: 'lib/portal/inventory-readiness.ts',
    mustContain: [
      'InventoryReadinessStep',
      'buildInventoryReadinessSteps',
      'getInventoryReadinessSummary',
      'inventoryEmptyStatePrinciples',
      'Connect Inventory backend later',
      'No fake stock totals'
    ]
  },
  {
    file: 'app/portal/inventory/readiness/page.tsx',
    mustContain: [
      'Inventory Onboarding Readiness',
      'Inventory setup readiness',
      'buildInventoryReadinessSteps',
      'getInventoryReadinessSummary',
      'readiness-flow-shell',
      'Empty State Rules',
      'Backend connection remains deferred'
    ],
    mustNotContain: [
      'sample stock',
      'sample supplier',
      'fake stock data shown'
    ]
  },
  {
    file: 'app/portal/page.tsx',
    mustContain: [
      'Inventory Readiness',
      'Open Readiness Flow',
      'buildInventoryReadinessSteps',
      'getInventoryReadinessSummary',
      'Next safe action'
    ]
  },
  {
    file: 'app/portal/inventory/page.tsx',
    mustContain: [
      'Readiness Flow',
      'Inventory Onboarding Readiness',
      'Empty State Principles',
      'inventoryEmptyStatePrinciples',
      'Open Readiness Flow'
    ]
  },
  {
    file: 'app/portal/inventory/[workflow]/page.tsx',
    mustContain: [
      'phase1f-empty-state-panel',
      'Empty State Governance',
      'Check Inventory Readiness',
      'inventoryEmptyStatePrinciples',
      'Backend connection remains deferred until scoped'
    ]
  },
  {
    file: 'app/portal/onboarding/page.tsx',
    mustContain: [
      'Inventory Readiness Flow',
      'Inventory Empty State Policy',
      'Open Inventory Readiness',
      'inventoryEnabled ? "Available first / gated" : "Inventory licence required"'
    ]
  },
  {
    file: 'components/PortalShell.tsx',
    mustContain: [
      'href: "/portal/inventory/readiness"',
      'label: "Readiness"'
    ]
  },
  {
    file: 'app/globals.css',
    mustContain: [
      'Portal Build Development Phase 1F',
      '.readiness-flow-shell',
      '.readiness-flow-step',
      '.phase1f-empty-state-panel',
      '.empty-state-action-row',
      '.readiness-note-grid'
    ]
  },
  {
    file: 'docs/ROUTE_PROTECTION_MANIFEST.md',
    mustContain: [
      'Portal Build Development Phase 1F Addendum',
      '/portal/inventory/readiness',
      'lib/portal/inventory-readiness.ts',
      'guided empty-state governance',
      'Backend connection remains deferred'
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


if (failed) process.exit(1);
console.log('Portal Phase 1F verification passed.');
console.log('Phase 1F static implementation checks passed.');
