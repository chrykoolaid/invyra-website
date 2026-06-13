# Wave 5 Phase 1B Build Notes

Phase 1B extends Phase 1A by converting reserved route maps into protected API foundations.

## Main Principle

The platform now treats users, environments, and devices as backend-enforced platform resources.

```text
No frontend-only access control.
No cross-organisation access.
No environment switch without server validation.
No device activation without a valid activation code and active Devices entitlement.
```

## User Management

The user management layer operates through `organisation_memberships` rather than assuming every user belongs to one organisation only.

This preserves future support for:

```text
Multi-store owners
External accountants
Consultants
Support users
Franchise groups
Multi-organisation operators
```

Owner transfer is intentionally blocked in Phase 1B because it requires a separate, higher-risk workflow.

## Environment Management

Environment switching updates the current server session. The active environment remains part of platform context and must be used by future operational modules.

Supported environments remain:

```text
LIVE
TRAINING
TEST
```

## Device Activation

Device activation is split into two workflows:

```text
Authorised portal user creates activation code
↓
Device claims activation code through public /api/devices/activate endpoint
↓
Device becomes organisation-scoped and audit logged
```

Activation codes are hashed before storage. The raw code is returned only once at creation time.

## Security Notes

Phase 1B includes audit logging for lifecycle events, but does not yet implement:

```text
MFA
SSO
Email invite delivery
Production-grade device fingerprint trust
Fine-grained device session auth middleware
```

Those belong to later platform hardening passes.
