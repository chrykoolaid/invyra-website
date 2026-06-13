# 🔒 INVYRA WEBSITE WAVE 5 PHASE 1F BUILD NOTES

## Scope Name

Wave 5 Phase 1F — Platform Verification + Local Migration Readiness Pass

## Purpose

Phase 1F does not introduce a new business module. It hardens the Phase 1A–1E platform foundation by adding verification structure, route-protection review, database migration readiness documentation, and a repeatable local validation command.

The goal is to prepare the platform foundation for local installation, Prisma migration, seed execution, type checking, and build verification without changing the public Wave 4 website or enabling live CRM, Inventory, POS, billing, integrations, or AI services.

## Added

```text
scripts/verify-phase1f.mjs
docs/PHASE1F_ACCEPTANCE_TESTS.md
docs/LOCAL_MIGRATION_READINESS.md
docs/SECURITY_VERIFICATION_MATRIX.md
docs/ROUTE_PROTECTION_MANIFEST.md
WAVE5_PHASE1F_COMPLETION_REPORT.md
```

## Updated

```text
invyra-platform/package.json
invyra-platform/.env.example
invyra-platform/README.md
```

## New Commands

```bash
npm run verify:phase1f
npm run verify
```

These run a dependency-free Node.js verification script that checks the presence of required files, Prisma schema foundations, route protection patterns, package scripts, and Phase 1F documentation.

## Preserved

```text
Wave 4 public website
Wave 5 Phase 1A platform foundation
Wave 5 Phase 1B API foundation
Wave 5 Phase 1C organisation and licensing foundation
Wave 5 Phase 1D onboarding foundation
Wave 5 Phase 1E audit and session security hardening
```

## Still Out of Scope

```text
Live CRM
Live Inventory
Live POS
Forecasting
Billing engine
Subscription payments
Third-party integrations
AI services
Mobile app
Marketplace
Production SSO
Production email delivery
```

## Phase 1F Build Intent

Phase 1F is a readiness gate. It helps answer:

```text
Are required platform files present?
Are security-critical routes protected or intentionally public?
Is the Prisma schema ready for local migration?
Is the local setup order documented?
Are acceptance tests documented before deeper implementation continues?
```

## Recommended Local Verification Order

```bash
cd invyra-platform
npm run verify:phase1f
npm install
npm run prisma:generate
npm run prisma:migrate -- --name wave5_phase1f_verification_readiness
npm run db:seed
npm run typecheck
npm run build
npm run dev
```

## Important Note

The verification script is not a substitute for a full Next.js build, Prisma migration, or runtime test. It is a preflight guard that can run before dependencies are installed.
