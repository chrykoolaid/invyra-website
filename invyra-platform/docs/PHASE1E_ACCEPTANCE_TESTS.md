# Wave 5 Phase 1E — Acceptance Tests

## Audit Review

- [ ] Logged-out users cannot access `/portal/admin/audit`.
- [ ] Staff users cannot access `/portal/admin/audit` unless explicitly granted Administration View.
- [ ] Audit logs only show the active organisation's events.
- [ ] Audit review displays event time, user, action, result, module, environment, and target.
- [ ] Access-denied counts are visible.
- [ ] Security-event counts are visible.

## Security Review

- [ ] Logged-out users cannot access `/portal/admin/security`.
- [ ] Staff users cannot access `/portal/admin/security` unless explicitly granted Administration View.
- [ ] Security review only shows sessions belonging to the current organisation.
- [ ] Active sessions are labelled ACTIVE.
- [ ] Expired sessions are labelled EXPIRED.
- [ ] Logged-out/revoked sessions are labelled LOGGED_OUT.
- [ ] The current session is identified.
- [ ] Failed login attempts are visible.
- [ ] Access-denied audit events are visible.

## Security APIs

- [ ] `GET /api/audit/security` requires authentication.
- [ ] `GET /api/audit/security` requires Administration View.
- [ ] `GET /api/audit/access-denied` requires authentication.
- [ ] `GET /api/audit/access-denied` requires Administration View.
- [ ] `GET /api/security/sessions` requires authentication.
- [ ] `GET /api/security/sessions` requires Administration View.
- [ ] `PATCH /api/security/sessions/:id/revoke` requires authentication.
- [ ] `PATCH /api/security/sessions/:id/revoke` requires Administration Administer.
- [ ] A session from another organisation cannot be revoked.
- [ ] Failed revocation creates `SESSION_REVOKE_FAILED` audit event.
- [ ] Successful revocation creates `SESSION_REVOKED` audit event.

## Regression Coverage

- [ ] Existing login still works.
- [ ] Existing logout still works.
- [ ] Existing onboarding APIs remain available.
- [ ] Existing licensing APIs remain available.
- [ ] Existing device APIs remain available.
- [ ] Existing user management APIs remain available.
- [ ] Existing environment switch APIs remain available.
