# Protected Portal Runtime QA

## Runtime QA Page

```text
/portal/admin/qa
```

## Manual QA Areas

### Logged-out

- `/portal` should redirect to `/login`.
- `/api/users` should return 401 without a session.

### Owner

- Owner should reach `/portal`.
- Owner should reach `/portal/admin/users`.
- Owner should reach `/portal/admin/security`.
- Owner should reach `/portal/admin/qa`.
- Owner should access organisation-scoped protected APIs.

### Staff

- Staff should log in successfully.
- Staff should not access `/portal/admin/users`.
- Staff should not access security audit APIs.
- Staff restrictions should generate access denied audit visibility.

### Environment

- Portal shell should show the active environment.
- Environment switching should remain protected.
- LIVE, TRAINING, and TEST must remain explicit context values.

### Audit

- Access denied events should be visible to authorised admin/owner users.
- Failed login attempts should be visible through the security review surface.
- Session revocation must stay audit logged.

## Scope Guard

This QA pass verifies platform protection only. It does not verify live CRM, Inventory, POS, billing, integrations, AI services, or marketplace functionality.

