# Phase 2 Acceptance Tests

## Organisation Isolation

- [ ] Organisation A user cannot access Organisation B `/api/users` data.
- [ ] Organisation A user cannot access Organisation B `/api/licensing` data.
- [ ] Organisation A user cannot access Organisation B `/api/devices` data.
- [ ] Organisation A user cannot access Organisation B `/api/onboarding/workflows` data.
- [ ] Cross-organisation attempt creates `ACCESS_DENIED` audit evidence.

## Role Security

- [ ] Staff cannot access `/portal/admin/users`.
- [ ] Staff cannot call `/api/users/invite`.
- [ ] Manager cannot update organisation ownership.
- [ ] Supervisor cannot allocate licenses.
- [ ] Administrator cannot perform owner-transfer actions.

## Environment Security

- [ ] LIVE context never returns TRAINING records.
- [ ] LIVE context never returns TEST records.
- [ ] TRAINING context never returns LIVE records.
- [ ] Disabled environment access blocks switch attempts.
- [ ] Environment switch creates audit evidence.

## Licensing Security

- [ ] Expired module license blocks route access.
- [ ] Suspended license blocks route access.
- [ ] Missing module entitlement blocks route access.
- [ ] Permission without entitlement is denied.

## Device Security

- [ ] Invalid activation code is rejected.
- [ ] Expired activation code is rejected.
- [ ] Suspended device cannot activate a protected session.
- [ ] Retired device cannot be reused.
- [ ] Device lifecycle changes create audit evidence.

## Audit Integrity

- [ ] Every denied access attempt is logged.
- [ ] Every role change is logged.
- [ ] Every license change is logged.
- [ ] Every session revoke is logged.
- [ ] Every device lifecycle event is logged.
