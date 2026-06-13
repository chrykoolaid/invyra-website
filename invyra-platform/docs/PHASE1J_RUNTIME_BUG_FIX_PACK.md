# Wave 5 Phase 1J — Runtime Bug Fix Pack

## Purpose

This document defines the first runtime bug-fix checklist for local setup.

## Known first-run issue checklist

### 1. PostgreSQL not running

Symptoms:

```text
Can't reach database server
ECONNREFUSED
```

Fix:

- Start PostgreSQL.
- Confirm the database exists.
- Confirm `DATABASE_URL` in `.env` matches the local database.

### 2. Prisma client not generated

Symptoms:

```text
@prisma/client did not initialize yet
```

Fix:

```bash
npm run prisma:generate
```

### 3. Missing database tables

Symptoms:

```text
The table does not exist in the current database
```

Fix:

```bash
npm run prisma:migrate -- --name wave5_phase1j_runtime_bug_fix_pack
```

### 4. Seed not run

Symptoms:

```text
No active organisation access was found
Seeded users cannot log in
```

Fix:

```bash
npm run db:seed
```

### 5. Incorrect seeded password

Default development password is controlled by:

```text
INVYRA_SEED_PASSWORD
```

If unset, the seed default is:

```text
InvyraDemo#2026!
```

### 6. Session cookie issues

Check:

```text
INVYRA_SESSION_COOKIE
INVYRA_SESSION_DAYS
NODE_ENV
```

In production, cookies are secure-only. In local development, run with `NODE_ENV=development`.

### 7. Access denied for admin pages

Confirm the logged-in seeded user has an active membership and the correct role.

Use:

```bash
npm run verify:seeded-roles
```

### 8. Environment switch not sticking

Confirm the user has `environment_access` rows for LIVE, TRAINING, and TEST.

### 9. Device activation fails

Confirm:

- activation code exists
- code is not expired
- organisation license permits device use
- device status is not suspended or retired

### 10. Audit logs missing

Confirm protected routes are using platform guard/audit utilities and that the local database has migrated successfully.

## Retest Standard

Every fixed bug must pass:

```bash
npm run doctor
npm run verify:phase1j
npm run verify:runtime-full
npm run typecheck
npm run build
```
