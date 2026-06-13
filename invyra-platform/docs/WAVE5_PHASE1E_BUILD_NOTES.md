# Wave 5 Phase 1E — Audit Review + Session Security Hardening Build Notes

## Scope

Phase 1E extends the Phase 1D onboarding foundation with security review surfaces and session hardening APIs.

This phase does not introduce live CRM, Inventory, POS, billing, integrations, or AI business logic.

## Added

### Audit Review

- Expanded `/portal/admin/audit` from a simple table into an audit review surface.
- Added access-denied event counts.
- Added security-event counts.
- Preserved organisation scoping.
- Preserved environment visibility.

### Security Review

- Added `/portal/admin/security`.
- Shows active, expired, and logged-out sessions.
- Shows failed logins.
- Shows recent access-denied events.
- Shows current-session identification.

### APIs

```text
GET    /api/audit/security
GET    /api/audit/access-denied
GET    /api/security/sessions
PATCH  /api/security/sessions/:id/revoke
```

### Library Additions

```text
lib/security/session-security.ts
```

Provides:

- Security summary
- Organisation session listing
- Session state classification
- Failed-login listing
- Access-denied audit listing
- Security audit listing
- Organisation-scoped session revocation

## Security Rules Preserved

- Sessions are organisation-scoped.
- Admin/security review APIs require Administration permissions.
- Session revoke requires Administration Administer permission.
- Access-denied events stay audit logged.
- Session revocation creates audit logs.
- A session from another organisation cannot be revoked.

## Deferred

- MFA enforcement
- Rate limiting
- CSRF hardening for browser form actions
- Device fingerprint trust scoring
- Email alert delivery
- SIEM export
- Suspicious activity detection rules
- Production observability
