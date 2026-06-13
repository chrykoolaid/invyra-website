# First Runtime Debug Cycle

Use this after unzipping the Wave 5 Phase 1I package.

## 1. Enter the platform folder

```bash
cd invyra-platform
```

## 2. Run the local install doctor first

```bash
npm run doctor
```

This checks Node.js, npm, required files, `.env.example`, and pinned dependency safety before install.

## 3. Create your local environment file

```bash
cp .env.example .env
```

Then update:

```text
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/invyra_platform?schema=public"
SESSION_SECRET="replace-with-a-long-random-secret"
INVYRA_PLATFORM_ENV="development"
```

## 4. Install dependencies

```bash
npm install
```

## 5. Generate Prisma client

```bash
npm run prisma:generate
```

## 6. Run migration

```bash
npm run prisma:migrate -- --name wave5_phase1i_runtime_debug
```

## 7. Seed demo data

```bash
npm run db:seed
```

## 8. Run static and database-backed checks

```bash
npm run verify:phase1i
npm run verify:runtime
```

## 9. Start the app

```bash
npm run dev
```

Open the local app URL printed in the terminal.

## 10. Run API smoke tests in a second terminal

```bash
npm run verify:api-smoke
```

or, if the server is running on a custom port:

```bash
INVYRA_PLATFORM_URL=http://localhost:3000 npm run verify:api-smoke
```

## 11. Full runtime check

```bash
npm run verify:runtime-full
```

## First Debug Cycle Expected Results

- Login page loads.
- Portal routes reject logged-out users.
- Seeded owner can access protected admin APIs.
- Seeded staff user is blocked from admin/security APIs.
- Audit and access-denied events are created.
- Runtime QA page is visible to authorised admin users.

## If Something Fails

Run:

```bash
npm run doctor
```

Then check `docs/LOCAL_INSTALL_TROUBLESHOOTING.md`.
