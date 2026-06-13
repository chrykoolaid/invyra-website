# Invyra Platform — Wave 5 Phase 1J

This folder adds the first real SaaS platform foundation beside the existing Wave 4 public website.

Wave 5 Phase 1J extends Phase 1I with the first local test results review and runtime bug-fix pack. It keeps the public website intact while preparing the secure platform layer for real local runtime validation.


## Phase 1J Runtime Review Commands

```bash
npm run doctor
npm run verify:phase1j
npm run review:local-results
npm run verify:local
```

To capture real local test results, copy the template first:

```bash
cp docs/PHASE1J_LOCAL_TEST_RESULTS_TEMPLATE.json runtime-test-results.json
npm run review:local-results
```

Phase 1J is a runtime-readiness and bug-fix pack. It does not add live CRM, Inventory, POS, billing, integrations, or AI services.

## What this build pack includes

- PostgreSQL-targeted Prisma schema
- Organisation-scoped tenancy model
- User, membership, role, permission, license, device, environment, onboarding, session, and audit tables
- Secure password hashing helpers
- Session token hashing and HTTP-only cookie handling
- Login, logout, forgot-password, reset-password, and session APIs
- Protected user lifecycle APIs
- Protected environment switch APIs
- Protected device management APIs
- Public device activation claim API
- Protected organisation profile APIs
- Protected organisation settings APIs
- Protected licensing lifecycle APIs
- Protected licensing allocation APIs
- Protected licensing consumption API
- Public access request API
- Protected onboarding workflow APIs
- Protected onboarding step update and completion APIs
- Protected audit review APIs
- Protected access-denied review API
- Protected security event review API
- Protected session list API
- Protected session revoke API
- Minimal protected portal shell
- Public access request page
- Onboarding admin page
- Security review page
- Access-denied handling
- Seed data for Owner, Administrator, Manager, Supervisor, and Staff roles

## Phase 1B API Additions Preserved

### User Management

```text
GET    /api/users
POST   /api/users/invite
PATCH  /api/users/:id/activate
PATCH  /api/users/:id/suspend
PATCH  /api/users/:id/deactivate
PATCH  /api/users/:id/role
```

### Environment Management

```text
GET  /api/environments
GET  /api/environments/current
POST /api/environments/switch
```

### Device Activation

```text
GET    /api/devices
POST   /api/devices/activation-code
POST   /api/devices/activate
PATCH  /api/devices/:id/suspend
PATCH  /api/devices/:id/retire
```

## Phase 1C API Additions Preserved

### Organisation Administration

```text
GET    /api/organisations/current
PATCH  /api/organisations/current
GET    /api/organisations/settings
PATCH  /api/organisations/settings
```

### Licensing Management

```text
GET    /api/licensing
POST   /api/licensing/create
POST   /api/licensing/modules/allocate
POST   /api/licensing/users/allocate
POST   /api/licensing/devices/allocate
GET    /api/licensing/consumption
PATCH  /api/licensing/:id/status
PATCH  /api/licensing/:id/expiry
```

## Phase 1D API Additions Preserved

### Access Requests

```text
POST   /api/onboarding/access-request
GET    /api/onboarding/access-requests
POST   /api/onboarding/access-requests/:id/attach
PATCH  /api/onboarding/access-requests/:id/review
```

### Onboarding Workflows

```text
POST   /api/onboarding/workflows
GET    /api/onboarding/workflows/current
GET    /api/onboarding/workflows/:id
PATCH  /api/onboarding/workflows/:id/steps/:stepKey
POST   /api/onboarding/workflows/:id/complete
```

## Phase 1E API Additions

### Audit + Security Review

```text
GET    /api/audit
GET    /api/audit/security
GET    /api/audit/access-denied
```

### Session Security

```text
GET    /api/security/sessions
PATCH  /api/security/sessions/:id/revoke
```

## Pages

```text
/login
/forgot-password
/reset-password
/activate
/onboarding/create-organisation
/portal
/portal/admin/organisation
/portal/admin/users
/portal/admin/environments
/portal/admin/onboarding
/portal/admin/audit
/portal/admin/security
/portal/licensing
/portal/devices
```

## What this build pack does not include

- Live CRM
- Live Inventory
- Live POS
- Billing or subscription payments
- SSO / SAML / Okta / Azure AD / Google Workspace
- Production email delivery
- Third-party integrations
- AI services
- Ownership transfer workflow
- Full production device fingerprint trust
- Customer offboarding / destructive closure workflow
- Invyra internal intake dashboard

## Setup

```bash
cd invyra-platform
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name wave5_phase1e_security_hardening
npm run db:seed
npm run dev
```

Default local users after seed:

| Role | Login |
|---|---|
| Owner | owner@invyra.local |
| Administrator | admin@invyra.local |
| Manager | manager@invyra.local |
| Supervisor | supervisor@invyra.local |
| Staff | staff@invyra.local |

Default seed password:

```text
InvyraDemo#2026!
```

Change it through `INVYRA_SEED_PASSWORD` before seeding if required.

## Security note

This is an implementation foundation, not a production deployment package. Before production, add production-grade email delivery, MFA, rate limiting, CSRF hardening for non-idempotent browser actions, secrets management, observability, backup policy, and deployment security controls.

---

## Wave 5 Phase 1F Additions

Phase 1F is the platform verification and local migration-readiness pass.

### Added

```text
Dependency-free platform verification script
Route protection manifest
Security verification matrix
Local migration readiness guide
Phase 1F acceptance tests
Phase 1F completion report
```

### New Verification Command

Run before installing dependencies:

```bash
node scripts/verify-phase1f.mjs
```

Run after installing dependencies:

```bash
npm run verify:phase1f
```

### Recommended Local Verification Order

```bash
cd invyra-platform
node scripts/verify-phase1f.mjs
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name wave5_phase1f_verification_readiness
npm run db:seed
npm run typecheck
npm run build
npm run dev
```

### Phase 1F Documents

```text
docs/WAVE5_PHASE1F_BUILD_NOTES.md
docs/PHASE1F_ACCEPTANCE_TESTS.md
docs/LOCAL_MIGRATION_READINESS.md
docs/SECURITY_VERIFICATION_MATRIX.md
docs/ROUTE_PROTECTION_MANIFEST.md
```

### Phase 1F Intent

Phase 1F does not add live CRM, live Inventory, live POS, billing, integrations, or AI services. It prepares the platform foundation for local migration, runtime testing, route-protection verification, and security acceptance testing.

---

## Wave 5 Phase 1H Additions

Phase 1G is the local runtime fix pass and seeded role verification pass.

### Added

```text
Dependency-free Phase 1G verifier
Database-backed runtime health script
Database-backed seeded role verification script
Idempotent demo platform license seed
Idempotent demo module entitlement seed
Seeded role verification guide
Local runtime fix pass guide
Phase 1G acceptance tests
Phase 1G runtime command guide
```

### New Commands

Run before installing dependencies:

```bash
node scripts/verify-phase1g.mjs
```

Run through npm after installing dependencies:

```bash
npm run verify:phase1g
```

Run after migration and seed:

```bash
npm run verify:runtime
```

Run only the seeded role matrix check:

```bash
npm run verify:seeded-roles
```

### Recommended Phase 1G Local Verification Order

```bash
cd invyra-platform
node scripts/verify-phase1g.mjs
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name wave5_phase1g_runtime_readiness
npm run db:seed
npm run verify:runtime
npm run typecheck
npm run build
npm run dev
```

### Phase 1G Documents

```text
docs/WAVE5_PHASE1G_BUILD_NOTES.md
docs/PHASE1G_ACCEPTANCE_TESTS.md
docs/LOCAL_RUNTIME_FIX_PASS.md
docs/SEEDED_ROLE_VERIFICATION.md
docs/PHASE1G_RUNTIME_COMMANDS.md
```

### Phase 1G Intent

Phase 1G does not add live CRM, live Inventory, live POS, billing, integrations, mobile apps, marketplace, or AI services. It makes the Phase 1 foundation safer to run locally by improving seed idempotency and adding database-backed verification for the seeded role, permission, licensing, and environment baseline.


## Wave 5 Phase 1H — Protected Portal Runtime QA

Phase 1H adds a protected runtime QA page and API smoke-test harness.

```bash
npm run verify:phase1h
npm run verify:api-smoke
```

Protected Portal Runtime QA page:

```text
/portal/admin/qa
```

Run `npm run verify:api-smoke` only after local migration, seed, and `npm run dev` are active.

---

## Wave 5 Phase 1I — Local Install Error Fix Pass + First Runtime Debug Cycle

Wave 5 Phase 1I prepares the platform foundation for the first real local runtime debug cycle.

### Added

```text
Local install doctor
Phase 1I static verifier
Pinned dependency versions
Node.js / npm engine requirements
First Runtime Debug Cycle guide
Local Install Troubleshooting guide
Updated package scripts
```

### New Commands

Run before installing dependencies:

```bash
node scripts/local-install-doctor.mjs
node scripts/verify-phase1i.mjs
```

Run through npm after installing dependencies:

```bash
npm run doctor
npm run verify:phase1i
npm run verify:local
```

### Recommended Phase 1I Local Verification Order

```bash
cd invyra-platform
npm run doctor
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name wave5_phase1i_runtime_debug
npm run db:seed
npm run verify:phase1i
npm run verify:runtime
npm run typecheck
npm run build
npm run dev
```

Then, in a second terminal:

```bash
npm run verify:api-smoke
```

### Phase 1I Documents

```text
docs/WAVE5_PHASE1I_BUILD_NOTES.md
docs/PHASE1I_ACCEPTANCE_TESTS.md
docs/FIRST_RUNTIME_DEBUG_CYCLE.md
docs/LOCAL_INSTALL_TROUBLESHOOTING.md
docs/WAVE5_PHASE1I_COMPLETION_REPORT.md
```

### Phase 1I Intent

Phase 1I does not add live CRM, live Inventory, live POS, billing, integrations, mobile apps, marketplace, or AI services. It exists to reduce local setup failures and prepare for the first real runtime bug-fix cycle.

---

## Wave 5 Phase 2 — Security & Multi-Tenant Verification

Phase 2 verifies that the platform foundation is tenant-safe before production readiness.

### New Commands

```bash
npm run verify:phase2
npm run verify:security
npm run verify:local
```

### New Review Page

```text
/portal/admin/tenant-verification
```

### Phase 2 Proof Areas

- Organisation isolation
- Role boundary enforcement
- Environment separation
- License enforcement
- Device trust
- Audit integrity

See:

```text
docs/PHASE2_SECURITY_TENANT_VERIFICATION.md
docs/PHASE2_ACCEPTANCE_TESTS.md
docs/PHASE2_TEST_MANIFEST.json
docs/WAVE5_PHASE2_COMPLETION_REPORT.md
```

---

# Wave 5 Phase 3 — Production Readiness Pass

Phase 3 adds the production-readiness layer for the Wave 5 platform foundation.

## Added Documentation

- `docs/PRODUCTION_READINESS_ARCHITECTURE.md`
- `docs/BACKUP_RECOVERY_RUNBOOK.md`
- `docs/MONITORING_LOGGING_PLAN.md`
- `docs/RELEASE_MANAGEMENT_RUNBOOK.md`
- `docs/PHASE3_PRODUCTION_READINESS_CHECKLIST.md`
- `docs/PHASE3_ACCEPTANCE_TESTS.md`
- `docs/WAVE5_PHASE3_COMPLETION_REPORT.md`

## New Commands

```bash
npm run verify:phase3
npm run verify:production
npm run verify:local
```

## Local Production-Readiness Validation

```bash
npm install
npm run doctor
npm run verify:phase3
npm run typecheck
npm run build
```

Phase 3 does not introduce live CRM, Inventory, POS, billing, integrations, AI, marketplace, or mobile app functionality.
