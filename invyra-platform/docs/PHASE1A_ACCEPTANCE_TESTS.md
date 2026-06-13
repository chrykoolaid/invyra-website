# Wave 5 Phase 1A Acceptance Tests

## Setup

```bash
cd invyra-platform
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name wave5_phase1a_platform_foundation
npm run db:seed
npm run dev
```

## Test users

Password defaults to `InvyraDemo#2026!` unless changed in `.env` before seed.

| Role | Login |
|---|---|
| Owner | owner@invyra.local |
| Administrator | admin@invyra.local |
| Manager | manager@invyra.local |
| Supervisor | supervisor@invyra.local |
| Staff | staff@invyra.local |

## Required tests

### 1. Logged-out portal block

1. Open `/portal` in a private/incognito browser.
2. Expected: redirected to `/login`.

### 2. Owner login

1. Login with `owner@invyra.local`.
2. Expected: redirected to `/portal`.
3. Expected: topbar shows organisation, environment, role, and session active.

### 3. Session API

1. While logged in, open `/api/auth/session`.
2. Expected: JSON response includes user, organisation, role, environment, and environment access.

### 4. Staff admin block

1. Logout.
2. Login as `staff@invyra.local`.
3. Open `/portal/admin/users`.
4. Expected: redirected to `/access-denied`.
5. Expected: `ACCESS_DENIED` audit log exists.

### 5. Audit log access

1. Login as Owner or Administrator.
2. Open `/portal/admin/audit`.
3. Expected: login and seed audit records are visible.

### 6. Logout

1. Click Logout.
2. Open `/portal` again.
3. Expected: redirected to `/login`.

### 7. Forgot password request

1. Open `/forgot-password`.
2. Submit a seeded user email.
3. Expected: reset workflow created without exposing account existence in the UI.

### 8. License enforcement foundation

1. Login as Owner.
2. Open `/portal/licensing`.
3. Expected: active module entitlements appear.
4. Developer check: remove or expire a module license in the database.
5. Expected: backend access checks deny that module.

### 9. Environment isolation foundation

1. Confirm seeded environment access rows exist for LIVE, TRAINING, TEST.
2. Remove LIVE access for a test membership.
3. Expected: module access checks deny LIVE actions for that membership.

## Phase 1A pass condition

Phase 1A passes when:

- Authentication works with seeded users.
- Session tracking is created and invalidated.
- Organisation context loads from active membership.
- Staff cannot access admin user management.
- Denied access creates audit logs.
- Licensing and environment enforcement helpers are present and callable.
