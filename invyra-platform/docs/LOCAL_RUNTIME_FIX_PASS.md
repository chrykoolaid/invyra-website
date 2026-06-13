# Local Runtime Fix Pass — Wave 5 Phase 1G

## Purpose

Phase 1G prepares the platform foundation for local runtime validation after install and migration.

It focuses on:

```text
Safe repeatable seed behavior
Database-backed health checks
Seeded role verification
Permission matrix verification
Environment access verification
License entitlement verification
```

## Local Setup Order

```bash
cd invyra-platform
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name wave5_phase1g_runtime_readiness
# equivalent Prisma action: prisma migrate dev
npm run db:seed
npm run verify:phase1g
npm run verify:runtime
npm run typecheck
npm run build
npm run dev
```

## Why the Seed Was Hardened

The previous seed created a new demo license each time it ran. That is risky during development because repeated setup can pollute local data.

Phase 1G uses an idempotent seeded license:

```text
invyra_demo_platform_license
```

and idempotent module allocation upserts.

## Expected Local Users

All users share the development seed password unless `INVYRA_SEED_PASSWORD` is changed before seeding.

```text
owner@invyra.local
admin@invyra.local
manager@invyra.local
supervisor@invyra.local
staff@invyra.local
```

## Verification Commands

```bash
npm run verify:phase1g
```

Dependency-free structure and route protection check.

```bash
npm run verify:seeded-roles
```

Database-backed seeded role and permission matrix check.

```bash
npm run verify:runtime
```

Database-backed runtime health check plus seeded role verification.

## Important

This pass does not make the app production-ready by itself. Production still requires:

```text
Rate limiting
CSRF hardening for browser mutations
Production email delivery
MFA
Secrets management
Backups
Monitoring
Deployment security controls
```
