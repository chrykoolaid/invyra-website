# 🔒 INVYRA WEBSITE WAVE 5 PHASE 1G — Build Notes

## Scope

Phase 1G is a local runtime-readiness and seeded role verification pass.

It does not introduce live CRM, live Inventory, live POS, billing, integrations, marketplace, AI, or mobile functionality.

## Added

```text
Dependency-free Phase 1G verifier
Database-backed runtime health script
Database-backed seeded role verification script
Idempotent demo license seed
Idempotent demo license module seed
Runtime command guide
Seeded role verification guide
Phase 1G acceptance tests
```

## Runtime Fix

The Phase 1F seed created a new demo license every time the seed command ran. Phase 1G converts the demo platform license and demo module allocations to stable upserts:

```text
invyra_demo_platform_license
```

This makes repeated local setup safer and prevents duplicate demo license pollution in development databases.

## Verification Layers

```text
npm run verify:phase1g
```

Checks project structure, scripts, docs, route protection, idempotent seed structure, and Phase 1G manifests without requiring dependency install.

```text
npm run verify:runtime
```

Runs database-backed runtime health checks and seeded role verification after install, migration, and seed.

```text
npm run verify:seeded-roles
```

Checks seeded users, roles, permissions, environment access, organisation settings, and licensing entitlements directly against the database.

## Preserved Boundaries

```text
No live CRM
No live Inventory
No live POS
No billing engine
No third-party integrations
No AI services
No customer data migration
```
