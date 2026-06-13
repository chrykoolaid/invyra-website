# Wave 5 Phase 1A — Database Schema + Auth Foundation Build Notes

## Scope delivered

Phase 1A creates the first real operational SaaS platform foundation for Invyra.

Included:

- `invyra-platform/` project shell
- PostgreSQL-targeted Prisma schema
- Multi-tenant organisation model
- User identity model
- Organisation membership model
- Role and permission model
- Environment access model for LIVE / TRAINING / TEST
- Licensing foundation schema
- Device activation foundation schema
- Onboarding foundation schema
- Session tracking schema and helpers
- Audit logging schema and helpers
- Password hashing helpers
- Token hashing helpers
- Login, logout, forgot-password, reset-password, and session API routes
- Protected `/portal` shell
- Admin organisation page
- Admin users page with role-gated access
- Licensing foundation page
- Devices foundation page
- Audit log viewer

## Architecture preserved

The existing Wave 4 public website remains unchanged.

Wave 5 Phase 1A adds the secure platform layer beside it:

```text
/public website files from Wave 4
/invyra-platform
```

## Security principles applied

- No portal access without a session cookie
- Session tokens are stored hashed in the database
- Passwords are bcrypt-hashed
- Reset tokens are stored hashed
- Suspended/deactivated users are blocked
- Organisation status is checked during session resolution
- Membership status is checked during session resolution
- Environment access is checked before module access
- Role permission is checked before module access
- License entitlement is checked before module access
- Access denial is audit-logged

## Not complete yet

The following are intentionally reserved for later Wave 5 passes:

- Production email delivery
- Full device activation workflow
- User invite/activate/suspend/deactivate APIs
- Role editing UI
- Environment switching UI
- MFA
- Rate limiting
- CSRF hardening for browser form workflows
- Production observability
- Deployment pipeline

## Recommended next pass

```text
Wave 5 Phase 1B — User Management + Environment + Device Activation APIs
```
