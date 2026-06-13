# Wave 5 Phase 1G Acceptance Tests

Phase 1G passes when the platform foundation can be installed, migrated, seeded, and verified locally without corrupting the Wave 5 platform baseline.

## Static Verification

```bash
cd invyra-platform
npm run verify:phase1g
```

Expected result:

```text
0 failed checks
```

This confirms:

```text
Required files exist
Phase 1G scripts exist
Phase 1G docs exist
Package scripts are registered
Seed uses idempotent license upserts
Route protection remains present
Required schema models remain present
```

## Runtime Health Verification

After local dependencies and database migration:

```bash
npm run verify:runtime
```

Expected result:

```text
Runtime health passes
Seeded role verification passes
```

This confirms:

```text
DATABASE_URL is configured
Database connection works
User table is queryable
Organisation table is queryable
Role table is queryable
Permission table is queryable
Session table is queryable
Audit log table is queryable
```

## Seeded Role Verification

This section covers seeded role verification and runtime health evidence after local migration.


```bash
npm run verify:seeded-roles
```

Expected result:

```text
Owner, Administrator, Manager, Supervisor, and Staff users exist
Each seeded user is active
Each seeded user has an active organisation membership
Each seeded user has LIVE, TRAINING, and TEST access
Expected permission matrix matches role permissions
Demo platform license exists and is active
All module entitlements are enabled
Demo onboarding workflow exists
Seed completion audit log exists
```

## Idempotent Seed Test

Run the seed twice:

```bash
npm run db:seed
npm run db:seed
npm run verify:seeded-roles
```

Expected result:

```text
No duplicate demo platform license required
No duplicate demo module entitlement failure
Seeded role verification still passes
```

## Environment Separation Check

The verifier must confirm baseline environment access for:

```text
LIVE
TRAINING
TEST
```

This does not prove future CRM/Inventory/POS data separation yet. It confirms the Wave 5 platform foundation has the environment access layer required before live modules are added.

## Out of Scope

These are not Phase 1G acceptance tests:

```text
Live CRM workflows
Live Inventory workflows
Live POS workflows
Billing workflows
Third-party integrations
AI services
Production deployment hardening
```
