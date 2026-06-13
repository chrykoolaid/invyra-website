# Wave 5 Phase 1J — Acceptance Tests

Phase 1J passes when the project is ready for the first real local runtime debug cycle.

## Required Checks

- Phase 1J static verifier passes.
- Local install doctor still passes.
- Runtime test results template exists.
- Local test review script runs without dependencies.
- Package scripts expose `review:local-results` and `verify:phase1j`.
- Runtime bug-fix checklist exists.
- First local test review guide exists.
- README includes Phase 1J commands.

## Local Runtime Checks To Perform On Developer Machine

- `npm install` completes.
- `npm run prisma:generate` completes.
- `npm run prisma:migrate` completes.
- `npm run db:seed` completes.
- Running seed twice does not duplicate core demo license/module data.
- `npm run verify:runtime-full` completes.
- `npm run typecheck` completes.
- `npm run build` completes.
- Login works with seeded Owner user.
- Staff cannot access Administration pages.
- Environment switch creates an audit trail.
- Device activation path can be exercised.
- Licensing consumption endpoint returns organisation-scoped data.
- Access denied events are visible.

## Explicit Non-Scope

- No live CRM
- No live Inventory
- No live POS
- No billing
- No payments
- No integrations
- No AI services
- No mobile app
