# Inventory Local Data Seed Review — Phase 2H

## Current seed status

The existing `prisma/seed.ts` seeds platform foundations:

- users
- roles
- permissions
- organisation
- environments
- licence modules
- onboarding/readiness support data

Phase 2H confirms that local Inventory runtime QA should work even if no Inventory operational rows exist. Inventory operational seed rows are not required yet.

## Inventory operational seed status

Current expected status:

```text
Inventory item seed rows: optional / not required
Inventory supplier seed rows: optional / not required
Inventory movement seed rows: optional / not required
Inventory stock balance rows: optional / not required
Inventory configuration seed rows: optional / not required
```

## Why this is acceptable

The portal is currently read-only and must display honest empty states. Empty tables are valid during this stage because the next unsafe step would be pretending stock exists or silently mutating live stock.

## Future recommendation

A future phase may add a controlled **read-only demo seed pack** for TRAINING or TEST only.

That should be separately scoped as:

```text
Phase 2I — Inventory Read-only Demo Seed Pack
```

The seed pack must not contaminate LIVE stock and must not imply customer production data exists.
