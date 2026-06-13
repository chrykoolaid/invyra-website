# API Smoke Test Harness

## Command

```bash
npm run verify:api-smoke
```

Optional target override:

```bash
INVYRA_PLATFORM_URL=http://localhost:3000 npm run verify:api-smoke
```

## Required Before Running

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name wave5_phase1h_runtime_qa
npm run db:seed
npm run dev
```

Run the smoke test in a second terminal.

## What It Checks

- Logged-out `/portal` access redirects to login.
- Logged-out protected API access is rejected.
- Public access request route remains reachable.
- Seeded owner login works using `owner@invyra.local`.
- Seeded staff login works using `staff@invyra.local`.
- Owner can access protected administration APIs.
- Owner can read environment, licensing, devices, and security audit APIs.
- Staff cannot list admin users.
- Staff cannot read security audit data.
- Staff can still read their own auth session.

## Default Seed Password

The harness uses:

```text
InvyraDemo#2026!
```

Override with:

```bash
INVYRA_SEED_PASSWORD="your-password" npm run verify:api-smoke
```


The local server must be running before this command is executed.
