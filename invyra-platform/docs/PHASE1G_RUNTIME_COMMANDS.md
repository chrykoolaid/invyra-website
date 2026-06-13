# Wave 5 Phase 1G Runtime Commands

## Dependency-Free Verification

```bash
npm run verify:phase1g
```

Equivalent direct command:

```bash
node scripts/verify-phase1g.mjs
```

## Full Local Runtime Sequence

```bash
cd invyra-platform
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name wave5_phase1g_runtime_readiness
npm run db:seed
npm run verify:runtime
npm run typecheck
npm run build
npm run dev
```

## Seeded Role Verification Only

```bash
npm run verify:seeded-roles
```

## Runtime Health Only

```bash
tsx scripts/runtime-health.ts
```

## Start the Platform

```bash
npm run dev
```

Then open:

```text
/login
/portal
/portal/admin/users
/portal/admin/environments
/portal/admin/security
/portal/licensing
/portal/devices
```

## Default Local Credentials

```text
owner@invyra.local
admin@invyra.local
manager@invyra.local
supervisor@invyra.local
staff@invyra.local
```

Default password:

```text
InvyraDemo#2026!
```

Change `INVYRA_SEED_PASSWORD` before running `npm run db:seed` if you want a different local password.
