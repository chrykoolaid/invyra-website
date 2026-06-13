# Phase 2E Acceptance Tests

## Required Pass Conditions

- `prisma/schema.prisma` contains activated Inventory models.
- Inventory schema activation is not only stored in docs.
- Migration scaffold exists under `prisma/migrations/20260612020000_inventory_schema_activation/migration.sql`.
- API routes remain read-only.
- No upload parser is introduced.
- No write API route is introduced.
- No stock mutation function is introduced.
- CRM and POS remain future-only.
- Phase 2E verifier passes.
- Prior protected-portal verifiers still pass.

## Manual Local Validation After Dependencies Are Installed

```bash
cd invyra-platform
npm install
npm run prisma:generate
npx prisma validate
npm run verify:portal-phase2e
```

Optional migration check against a safe local database only:

```bash
npx prisma migrate status
```

Do not run migration commands against production until a database backup and migration window are confirmed.
