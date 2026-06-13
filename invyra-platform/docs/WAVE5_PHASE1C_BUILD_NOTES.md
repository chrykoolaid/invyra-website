# 🔒 INVYRA WEBSITE WAVE 5 PHASE 1C BUILD NOTES

## Scope Name

Wave 5 Phase 1C — Organisation Administration + Licensing Management APIs

## Baseline

Started from:

```text
invyra_website_wave5_phase1b_platform_api_foundation_v1.zip
```

## Objective

Extend the secure platform foundation with organisation administration and licensing management capabilities without introducing live CRM, Inventory, POS, billing, integrations, or AI services.

## Added

### Organisation Administration

```text
GET    /api/organisations/current
PATCH  /api/organisations/current
GET    /api/organisations/settings
PATCH  /api/organisations/settings
```

Capabilities:

```text
Organisation profile retrieval
Organisation profile update
Organisation settings retrieval
Organisation settings upsert
Owner-only guarded organisation status change
Audit logging for organisation profile/settings/status changes
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

Capabilities:

```text
License creation
Module entitlement allocation
User entitlement allocation
Device entitlement allocation
License status updates
License expiry updates
Consumption summary
License event logging
Audit logging for licensing changes
```

## Preserved

```text
Wave 4 public website
Wave 5 Phase 1A auth/database foundation
Wave 5 Phase 1B user/environment/device APIs
Organisation scoping
Environment separation
Backend permission checks
Backend license checks
Audit logging foundation
```

## Still Deferred

```text
Live CRM
Live Inventory
Live POS
Billing engine
Subscription payments
SSO
MFA
Third-party integrations
AI services
Ownership transfer workflow
Offboarding/destructive organisation closure workflow
```

## Security Notes

- Organisation updates require Administration/Administer access.
- Organisation status changes are owner-only and block destructive closure.
- Licensing management requires Licensing/Administer access.
- All licensing records are scoped by current organisation.
- License allocation checks organisation membership or device ownership before assignment.
- All sensitive changes write audit logs.
