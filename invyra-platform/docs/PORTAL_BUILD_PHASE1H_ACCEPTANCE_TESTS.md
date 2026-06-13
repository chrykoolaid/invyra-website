# Portal Build Phase 1H Acceptance Tests

## Scope

Phase 1H adds the Inventory admin configuration shell.

## Required Checks

```text
✅ /portal/inventory/configuration exists
✅ Route requires getCurrentSession
✅ Route requires canAccessModule({ module: "INVENTORY", level: "ADMINISTER" })
✅ PortalShell includes Admin Config navigation
✅ Inventory Dashboard links to Admin Configuration
✅ Workflow detail pages link to Admin Configuration
✅ Setup Actions includes admin configuration preparation
✅ Configuration groups are displayed as disabled controls
✅ Configuration page contains no form submission
✅ Configuration page contains no file upload
✅ Configuration page contains no save settings action
✅ Configuration page contains no Prisma mutation call
✅ Route manifest documents Phase 1H
```

## Manual QA

1. Log in as a user with Inventory view access only.
2. Confirm Admin Config navigation appears restricted or leads to access denied.
3. Log in as a user with Inventory administer access.
4. Open `/portal/inventory/configuration`.
5. Confirm environment banner is visible.
6. Confirm all setting controls are disabled/planning-only.
7. Confirm no save buttons, forms, uploads, or mutation claims are visible.
8. Confirm CRM and POS remain future-only.

## Boundary

Phase 1H must not implement backend configuration persistence.
