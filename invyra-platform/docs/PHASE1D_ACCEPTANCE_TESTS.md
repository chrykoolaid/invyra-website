# Wave 5 Phase 1D Acceptance Tests

## Access Request

- Public user can submit an access request through `POST /api/onboarding/access-request`.
- Invalid email is rejected with `422`.
- Blank requester name or company name is rejected.
- Access request creation creates an `ACCESS_REQUEST_CREATED` audit log.

## Protected Onboarding APIs

- Logged-out users cannot list access requests.
- Staff users cannot attach or review access requests.
- Staff users cannot create onboarding workflows.
- Administrators can create an onboarding workflow for their organisation.
- Access request listing only returns requests attached to the current organisation.
- Reviewing an access request creates an `ACCESS_REQUEST_REVIEWED` audit log.

## Workflow Rules

- Workflow creation generates standard onboarding steps:
  - Access Request
  - Review
  - Organisation Setup
  - License Assignment
  - Device Assignment
  - Portal Access
- Updating a workflow step creates an `ONBOARDING_STEP_UPDATED` audit log.
- Completing `license_assignment` advances workflow status to `LICENSES_ASSIGNED`.
- Completing `device_assignment` advances workflow status to `DEVICES_ASSIGNED`.
- Completing `portal_access` advances workflow status to `PORTAL_READY`.
- Workflow cannot be completed until every step is `COMPLETE`.
- Completing a workflow creates an `ONBOARDING_WORKFLOW_COMPLETED` audit log.

## Environment / Tenant Safety

- Onboarding workflow queries must include the current organisation context.
- Users cannot read onboarding workflows from another organisation.
- Onboarding admin page requires a valid active session.

## Deferred Validation

The following require local installation and database setup:

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run typecheck
npm run build
```
