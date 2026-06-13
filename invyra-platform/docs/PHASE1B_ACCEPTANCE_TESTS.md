# Wave 5 Phase 1B Acceptance Tests

## User Management

- Logged-out request to `GET /api/users` returns 401.
- Staff request to `GET /api/users` returns 403 and creates an access-denied audit log.
- Owner/Admin can invite a user through `POST /api/users/invite`.
- Inviting a user creates an organisation membership, role, environment access rows, and audit log.
- Owner role cannot be assigned through the normal role API.
- Organisation owner cannot be suspended or deactivated through the normal lifecycle API.
- Suspending a user logs out active sessions.
- Deactivating a user logs out active sessions.
- Role changes create a `ROLE_CHANGED` audit log.

## Environment Management

- Logged-out request to `GET /api/environments` returns 401.
- Current environment is returned by `GET /api/environments/current`.
- `POST /api/environments/switch` rejects invalid environment values.
- Environment switch is blocked if organisation setting is disabled.
- Environment switch is blocked if membership access is denied.
- Successful environment switch updates the current session.
- Successful environment switch creates an `ENVIRONMENT_SWITCHED` audit log.
- Blocked environment switch creates an `ACCESS_DENIED` audit log.

## Device Activation

- Logged-out request to `GET /api/devices` returns 401.
- Staff request to `POST /api/devices/activation-code` returns 403.
- Owner/Admin can create a device activation code with an active Devices license entitlement.
- Raw activation code is returned only at creation time.
- Stored activation code uses a hash.
- `POST /api/devices/activate` rejects invalid, consumed, or expired codes.
- Successful activation creates a device, consumes the activation code, and creates audit logs.
- Duplicate device identifiers are rejected.
- Suspended devices close active device sessions.
- Retired devices close active device sessions.

## Environment Isolation Reminder

Future operational module queries must continue to include:

```text
organisation_id
environment
```

Phase 1B does not add live CRM, Inventory, or POS business data.
