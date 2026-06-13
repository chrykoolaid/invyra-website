import fs from 'node:fs';

const checks = [
  {
    file: 'lib/portal/portal-access.ts',
    mustContain: [
      'getPortalAccessSnapshot',
      'userPermissionOverride.findMany',
      'hasPortalModuleAccess',
      'getInventoryWorkflowVisibility',
      'getPortalModuleVisibility',
      'getVisibilityLabel'
    ],
    mustNotContain: ['auditLog(']
  },
  {
    file: 'components/PortalShell.tsx',
    mustContain: [
      'getPortalAccessSnapshot(session)',
      'getInventoryWorkflowVisibility(workflow, accessSnapshot)',
      'getPortalModuleVisibility(module, accessSnapshot)',
      'sidebar-disabled-link',
      'licence-required'
    ]
  },
  {
    file: 'app/portal/page.tsx',
    mustContain: [
      'getPortalAccessSnapshot(session)',
      'hasPortalModuleAccess(accessSnapshot, "INVENTORY", "VIEW")',
      'getPortalModuleVisibility(module, accessSnapshot)',
      'getVisibilityLabel(visibility)',
      'No CRM operational access'
    ]
  },
  {
    file: 'app/portal/inventory/page.tsx',
    mustContain: [
      'getInventoryWorkflowVisibility(workflow, accessSnapshot)',
      'Required access: INVENTORY.{workflow.accessLevel}',
      'disabled-action',
      'Review Licence'
    ]
  },
  {
    file: 'app/portal/inventory/[workflow]/page.tsx',
    mustContain: [
      'getPortalAccessSnapshot(session)',
      'getInventoryWorkflowVisibility(item, accessSnapshot)',
      'workflow-route-disabled',
      'canAccessModule({ session, module: "INVENTORY", level: workflow.accessLevel })'
    ]
  },
  {
    file: 'app/portal/licensing/page.tsx',
    mustContain: [
      'canAccessModule({ session, module: "LICENSING", level: "VIEW" })',
      'getPortalAccessSnapshot(session)',
      'getPortalModuleVisibility(module, accessSnapshot)',
      'CRM, POS, and roadmap modules must not display operational Open actions yet.'
    ]
  },
  {
    file: 'app/portal/admin/tenant-verification/page.tsx',
    mustContain: [
      'getCurrentSession()',
      'canAccessModule({ session, module: "ADMINISTRATION", level: "VIEW" })',
      '<PortalShell session={session}>'
    ],
    mustNotContain: ['title=', 'active=']
  },
  {
    file: 'app/globals.css',
    mustContain: [
      'Portal Build Development Phase 1D',
      '.sidebar-disabled-link',
      '.state-restricted',
      '.workflow-route-disabled'
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
console.log('Portal Phase 1D verification passed.');
