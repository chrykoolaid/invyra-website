# Local Migration Readiness

## Purpose

This document provides the local verification order for the Wave 5 platform foundation before further platform enablement continues.

## Prerequisites

```text
Node.js 20+
PostgreSQL 15+
npm
Local database user with create/migrate permissions
```

## 1. Enter Platform Folder

```bash
cd invyra-platform
```

## 2. Run Dependency-Free Preflight

This can run before `npm install`.

```bash
node scripts/verify-phase1f.mjs
```

or after install:

```bash
npm run verify:phase1f
```

## 3. Create Local Environment File

```bash
cp .env.example .env
```

Update:

```text
DATABASE_URL
INVYRA_SESSION_COOKIE
INVYRA_PASSWORD_PEPPER
INVYRA_APP_URL
INVYRA_DEVICE_CODE_HOURS
INVYRA_SEED_PASSWORD
```

## 4. Install Dependencies

```bash
npm install
```

## 5. Generate Prisma Client

```bash
npm run prisma:generate
```

Equivalent:

```bash
npx prisma generate
```

## 6. Run Local Migration

```bash
npm run prisma:migrate -- --name wave5_phase1f_verification_readiness
```

Equivalent:

```bash
npx prisma migrate dev --name wave5_phase1f_verification_readiness
```

## 7. Seed Development Data

```bash
npm run db:seed
```

Expected demo users:

| Role | Login |
|---|---|
| Owner | owner@invyra.local |
| Administrator | admin@invyra.local |
| Manager | manager@invyra.local |
| Supervisor | supervisor@invyra.local |
| Staff | staff@invyra.local |

Default seed password:

```text
InvyraDemo#2026!
```

## 8. Typecheck

```bash
npm run typecheck
```

## 9. Build

```bash
npm run build
```

## 10. Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Migration Readiness Pass Criteria

```text
Prisma client generates successfully
Migration applies successfully
Seed runs successfully
Typecheck passes
Build passes
Portal blocks logged-out users
Seeded Owner can access admin areas
Staff cannot access admin areas
Audit logs are generated for protected actions
```

## Common Local Issues

### PostgreSQL is not running

Start PostgreSQL and confirm the database in `DATABASE_URL` exists.

### Prisma cannot authenticate

Confirm username, password, database name, host, and port in `DATABASE_URL`.

### Seed fails due to existing records

Reset the local development database only if safe:

```bash
npx prisma migrate reset
```

Do not run reset against production data.

### Typecheck fails after dependency install

Confirm Prisma client was generated first:

```bash
npm run prisma:generate
```
