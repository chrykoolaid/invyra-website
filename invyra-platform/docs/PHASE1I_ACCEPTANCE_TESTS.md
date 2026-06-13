# Wave 5 Phase 1I Acceptance Tests

Phase 1I passes when the following are true.

## Static Verification

- `npm run verify:phase1i` exists.
- `npm run doctor` exists.
- `npm run verify:local` exists.
- The local install doctor script exists.
- The First Runtime Debug Cycle guide exists.
- The Local Install Troubleshooting guide exists.
- Package dependencies are pinned and do not use `latest`.
- Node.js and npm engine requirements are declared.

## Local Install Doctor

- `npm run doctor` checks Node.js version.
- `npm run doctor` checks npm availability.
- `npm run doctor` checks required project files.
- `npm run doctor` checks `.env.example` for `DATABASE_URL`.
- `npm run doctor` checks `.env.example` for `SESSION_SECRET`.
- `npm run doctor` reports clear next steps if local setup is incomplete.

## First Runtime Debug Cycle

- The guide gives a safe command order.
- The guide separates dependency install from Prisma generation.
- The guide separates Prisma migration from seed.
- The guide includes runtime verification.
- The guide includes API smoke verification.

## Scope Protection

- No live CRM is added.
- No live Inventory is added.
- No live POS is added.
- No billing engine is added.
- No integrations are added.
- No AI services are added.

## Completion Standard

Phase 1I is complete when static checks pass and the local install path is clearly documented for the first real runtime debug cycle.

## Exact Verification Keywords

- pinned dependencies
- first runtime debug cycle
- no live CRM
- no live Inventory
- no live POS
