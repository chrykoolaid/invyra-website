# Invyra Wave 5 Phase 1D Build Notes

## Scope

Wave 5 Phase 1D adds the onboarding and access request foundation on top of the Phase 1C organisation and licensing baseline.

This is still a platform foundation pass. It does not introduce live CRM, Inventory, POS, billing, integrations, AI services, or customer data migration.

## Added

- Public access request endpoint
- Organisation-scoped access request listing
- Access request attach/review foundation
- Onboarding workflow creation
- Onboarding workflow current-state lookup
- Onboarding workflow detail lookup
- Onboarding step update endpoint
- Onboarding completion endpoint
- Portal onboarding admin page
- Public create-organisation access request page
- Seeded demo onboarding request and workflow
- Audit logging for access request and workflow actions

## API Coverage

```text
POST   /api/onboarding/access-request
GET    /api/onboarding/access-requests
POST   /api/onboarding/access-requests/:id/attach
PATCH  /api/onboarding/access-requests/:id/review
POST   /api/onboarding/workflows
GET    /api/onboarding/workflows/current
GET    /api/onboarding/workflows/:id
PATCH  /api/onboarding/workflows/:id/steps/:stepKey
POST   /api/onboarding/workflows/:id/complete
```

## Pages Added

```text
/onboarding/create-organisation
/portal/admin/onboarding
```

## Security Notes

- Public access request creation is intentionally unauthenticated.
- Review, attach, workflow creation, step updates, and completion require Administration/Administer access.
- Organisation-scoped access request listing does not expose other organisations' onboarding data.
- All protected onboarding actions create audit records.

## Deferred

- Email notifications
- Invyra internal intake dashboard
- Organisation creation from public request
- Customer-facing onboarding invitation emails
- File uploads
- Identity verification
- Paid subscription onboarding
