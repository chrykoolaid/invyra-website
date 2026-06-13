# Phase 2 Security & Multi-Tenant Verification

## Objective

Prove that the Wave 5 platform foundation is tenant-safe before production readiness.

## Required Proof Areas

### 1. Organisation Isolation

- Organisation A cannot list users from Organisation B.
- Organisation A cannot read Organisation B licenses.
- Organisation A cannot read Organisation B devices.
- Organisation A cannot read Organisation B onboarding workflows.
- Organisation A cannot revoke Organisation B sessions.

### 2. Role Boundary Enforcement

- Staff cannot access Admin Users.
- Supervisor cannot change licensing.
- Manager cannot change organisation ownership.
- Administrator cannot transfer ownership.
- Owner-only actions remain blocked for lower roles.

### 3. Environment Separation

- LIVE records cannot appear in TRAINING.
- TRAINING records cannot appear in LIVE.
- TEST records cannot appear in LIVE.
- Environment switches require membership-level environment access.

### 4. License Enforcement

- Missing module entitlement blocks access.
- Expired license blocks access.
- Suspended license blocks access.
- Role permission alone is not enough to access a module.

### 5. Device Trust

- Invalid activation code fails.
- Expired activation code fails.
- Suspended device cannot be used for protected device access.
- Retired device cannot be reused without a new activation workflow.

### 6. Audit Integrity

- Access-denied events are logged.
- Role changes are logged.
- License changes are logged.
- Device lifecycle changes are logged.
- Environment switches are logged.
- Session revocations are logged.

## Phase 2 Pass Condition

Wave 5 Phase 2 passes only when security verification produces evidence for every proof area above.
