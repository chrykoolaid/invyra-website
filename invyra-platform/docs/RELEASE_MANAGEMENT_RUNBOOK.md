# Release Management Runbook

## Release Flow

Recommended release flow:

```text
Local development
↓
Static verification
↓
Typecheck
↓
Build
↓
Database migration review
↓
Staging deploy
↓
Staging smoke test
↓
Security/tenant verification
↓
Production deploy
↓
Post-release monitoring
```

## Required Pre-Release Commands

```bash
npm run doctor
npm run verify:phase3
npm run verify:security
npm run typecheck
npm run build
```

## Database Migration Rule

Any migration touching these areas requires extra review:

- users
- sessions
- organisations
- organisation_memberships
- roles
- permissions
- licenses
- devices
- audit_logs
- environment access tables

## Rollback Rule

Rollback plan must exist before production deploy.

Minimum rollback assets:

- Previous package/build artifact
- Database backup or reversible migration plan
- Environment variable snapshot
- Release notes
- Known-risk list
