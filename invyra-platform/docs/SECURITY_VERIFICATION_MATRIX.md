# Security Verification Matrix

## Purpose

This matrix defines the security surfaces that must remain intact before Wave 5 moves beyond platform foundation.

| Layer | Verification Target | Required Outcome |
|---|---|---|
| Authentication | Login, logout, session API | User identity must be established server-side |
| Session | Session token hash, expiry, logout/revoke state | Expired or revoked sessions must not grant access |
| Organisation | `organisationId` scoping | Users must not access another organisation's records |
| Membership | Active membership requirement | Suspended or deactivated memberships must be blocked |
| Permission | Role permission check | UI visibility alone must not grant access |
| License | Module entitlement check | Expired or unallocated modules must be blocked |
| Environment | LIVE / TRAINING / TEST context | Environment data must not mix |
| Device | Activation and device lifecycle | Suspended or retired devices must not remain trusted |
| Audit | Security and access events | Sensitive actions and denied access must be logged |
| Onboarding | Public request vs protected review | Public request is allowed; review/admin actions are protected |

## Required Protected Surfaces

```text
/portal
/portal/admin/*
/portal/licensing
/portal/devices
/api/users/*
/api/organisations/*
/api/licensing/*
/api/devices/activation-code
/api/devices/:id/suspend
/api/devices/:id/retire
/api/environments/*
/api/audit/*
/api/security/*
/api/onboarding/access-requests/*
/api/onboarding/workflows/*
```

## Intentionally Public Surfaces

```text
/login
/forgot-password
/reset-password
/activate
/onboarding/create-organisation
/api/auth/login
/api/auth/forgot-password
/api/auth/reset-password
/api/auth/session
/api/devices/activate
/api/onboarding/access-request
```

## Critical Non-Negotiables

```text
No organisation data without organisation membership
No module access without licence entitlement
No environment switching without allowed environment access
No admin APIs based only on frontend visibility
No hidden-button security
No cross-organisation audit visibility
No public creation of active production organisations without review
```

## Phase 1F Security Gate

Wave 5 may continue only if:

```text
Route protection manifest is reviewed
Verification script passes
Local migration succeeds
Seeded role tests pass
Denied-access events are auditable
Environment switch events are auditable
Session revoke events are auditable
```
