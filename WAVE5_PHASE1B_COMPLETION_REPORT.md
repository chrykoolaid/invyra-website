# 🔒 INVYRA WEBSITE WAVE 5 PHASE 1B COMPLETION REPORT v1

## Scope Name

🔒 **INVYRA WEBSITE WAVE 5 PHASE 1B — USER MANAGEMENT + ENVIRONMENT + DEVICE ACTIVATION API FOUNDATION v1**

## Status

**Build pack created.**

The existing Wave 4 static public website remains preserved. The Wave 5 platform foundation remains isolated inside:

```text
/invyra-platform
```

## Added in Phase 1B

### User Management API Foundation

```text
GET    /api/users
POST   /api/users/invite
PATCH  /api/users/:id/activate
PATCH  /api/users/:id/suspend
PATCH  /api/users/:id/deactivate
PATCH  /api/users/:id/role
```

Included controls:

```text
Organisation-scoped membership lookup
Role assignment protection
Owner transfer blocked
Session invalidation on suspend/deactivate
Audit logs for invite/activate/suspend/deactivate/role change
```

### Environment API Foundation

```text
GET  /api/environments
GET  /api/environments/current
POST /api/environments/switch
```

Included controls:

```text
LIVE / TRAINING / TEST validation
Organisation environment enablement check
Membership environment access check
Server-side session environment switch
Audit log on environment switch
Denied access audit on blocked switch
```

### Device Activation API Foundation

```text
GET    /api/devices
POST   /api/devices/activation-code
POST   /api/devices/activate
PATCH  /api/devices/:id/suspend
PATCH  /api/devices/:id/retire
```

Included controls:

```text
Activation code generation
Activation code hashing
Activation code expiry
Public device claim endpoint
Organisation status check
Devices license entitlement check
Duplicate device identifier prevention
Device audit logs
Global audit logs
Suspended/retired device session closure
```

### Portal Pages Updated

```text
/portal
/portal/admin/users
/portal/admin/environments
/portal/devices
/activate
```

### New Internal Libraries

```text
lib/api/responses.ts
lib/security/platform-guard.ts
lib/users/user-management.ts
lib/environments/environment-management.ts
lib/devices/device-activation.ts
```

## Still Out of Scope

```text
Live CRM
Live Inventory
Live POS
Billing
Payments
Third-party integrations
AI services
Mobile apps
SSO/SAML/Okta/Azure AD
Ownership transfer workflow
Email delivery for invitations
Full production device fingerprinting
```

## Local Setup Reminder

The code package is implementation-ready, but live verification still requires local dependency install and database migration:

```bash
cd invyra-platform
npm install
cp .env.example .env
npm run prisma:migrate
npm run db:seed
npm run dev
```

## Suggested Git Commit

```bash
git add .
git commit -m "Add Wave 5 Phase 1B platform API foundation"
```
