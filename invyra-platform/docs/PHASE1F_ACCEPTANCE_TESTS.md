# Wave 5 Phase 1F Acceptance Tests

## Scope

This acceptance test set validates the Wave 5 Phase 1F platform verification and migration-readiness pass. It does not validate live CRM, live Inventory, live POS, billing, integrations, or AI because those remain out of scope.

## A. Package Verification

| Test | Expected Result |
|---|---|
| Run `npm run verify:phase1f` from `/invyra-platform` before installing dependencies | Verification script runs using Node.js only |
| Required app, API, lib, Prisma, and docs files are present | All required file checks pass |
| Required Prisma models and enums are present | Schema foundation checks pass |
| Required package scripts are present | Script checks pass |
| Public and protected API route classifications are checked | Route manifest checks pass |

## B. Local Migration Readiness

| Test | Expected Result |
|---|---|
| Copy `.env.example` to `.env` | Local environment file can be created |
| Configure `DATABASE_URL` for PostgreSQL | Prisma can target local PostgreSQL |
| Run `npm install` | Dependencies install successfully |
| Run `npm run prisma:generate` | Prisma client generation succeeds |
| Run `npm run prisma:migrate -- --name wave5_phase1f_verification_readiness` | Database migration succeeds |
| Run `npm run db:seed` | Demo organisation, users, roles, permissions, environments, licenses, devices, and onboarding records seed successfully |

## C. Auth and Session Safety

| Test | Expected Result |
|---|---|
| Logged-out users open `/portal` | Redirected or blocked |
| Logged-out users call protected APIs | `401` unauthenticated response |
| Suspended users attempt portal access | Access denied |
| Deactivated users attempt login | Login blocked |
| Session expiry is reached | Session no longer grants access |
| Revoked session is used again | Access denied and audit/security event visible |

## D. Organisation Isolation

| Test | Expected Result |
|---|---|
| User from Organisation A requests Organisation B resources | Access denied |
| Staff user requests admin user list | Access denied |
| Manager attempts ownership-level action | Access denied |
| Admin reviews organisation-scoped audit logs | Only current organisation logs appear |

## E. Licensing and Module Access

| Test | Expected Result |
|---|---|
| User has role permission but module license is expired | Module access denied |
| User has role permission but module is not allocated | Module access denied |
| License allocation is changed | Audit log is created |
| License consumption endpoint is called by authorised admin | Organisation-scoped consumption is returned |

## F. Device Activation

| Test | Expected Result |
|---|---|
| Device activates with valid activation code | Device becomes activated and audit entry is created |
| Device activates with expired activation code | Activation rejected |
| Device activates with consumed activation code | Activation rejected |
| Suspended device attempts protected device session | Access denied |
| Retired device attempts reuse | Access denied |

## G. Environment Separation

| Test | Expected Result |
|---|---|
| User switches from LIVE to TRAINING | Active session environment changes and audit log is created |
| User without TEST access attempts TEST switch | Access denied |
| TRAINING data is requested while LIVE is active | Not returned |
| TEST data is requested while LIVE is active | Not returned |

## H. Audit and Access-Denied Review

| Test | Expected Result |
|---|---|
| Failed login occurs | Failed-login record or security audit is visible |
| Access denied occurs | Access denied audit entry is created |
| Role is changed | Audit log is created |
| User is suspended | Audit log is created |
| Device is suspended | Audit log is created |
| Environment is switched | Audit log is created |

## Phase 1F Pass Standard

Phase 1F is accepted when:

```text
npm run verify:phase1f passes
Local migration checklist is documented
Route protection manifest is present
Security verification matrix is present
Acceptance tests are documented
No public website files are damaged
No live business module is introduced
```
