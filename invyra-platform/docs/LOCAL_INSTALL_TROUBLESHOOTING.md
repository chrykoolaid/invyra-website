# Local Install Troubleshooting

## Node.js Version Error

Use Node.js 20 LTS or newer.

Check your version:

```bash
node --version
npm --version
```

Then run:

```bash
npm run doctor
```

## PostgreSQL Connection Error

Check that PostgreSQL is running and that your `.env` contains a valid `DATABASE_URL`.

Example:

```text
DATABASE_URL="postgresql://postgres:password@localhost:5432/invyra_platform?schema=public"
```

Common causes:

- Database does not exist.
- Username/password is wrong.
- PostgreSQL service is stopped.
- Port is not `5432`.
- `.env` was not created from `.env.example`.

## Prisma Generate Error

Run:

```bash
npm install
npm run prisma:generate
```

If it still fails, remove generated cache and retry:

```bash
rm -rf node_modules/.prisma
npm run prisma:generate
```

## Prisma Migration Error

Check:

```bash
npm run doctor
npx prisma validate
```

Then retry:

```bash
npm run prisma:migrate -- --name wave5_phase1i_runtime_debug
```

## Seed Error

Run migration first:

```bash
npm run prisma:migrate -- --name wave5_phase1i_runtime_debug
npm run db:seed
```

The seed is designed to be safe to run repeatedly and uses stable seeded records where possible.

## SESSION_SECRET Error

Add this to `.env`:

```text
SESSION_SECRET="replace-with-a-long-random-secret"
```

Do not use the example value in production.

## API Smoke Test Fails

Make sure the development server is running first:

```bash
npm run dev
```

Then in another terminal:

```bash
npm run verify:api-smoke
```

If your server is not on port 3000:

```bash
INVYRA_PLATFORM_URL=http://localhost:3001 npm run verify:api-smoke
```

## Build Error

Run checks in this order:

```bash
npm run doctor
npm run prisma:generate
npm run typecheck
npm run build
```

## Important Scope Reminder

Wave 5 Phase 1I is still platform foundation work only.

It does not enable live CRM, live Inventory, live POS, billing, integrations, or AI services.
