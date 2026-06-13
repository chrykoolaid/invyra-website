# Wave 5 Phase 1C Acceptance Tests

## Organisation Administration

```text
[ ] Logged-out user cannot access /api/organisations/current.
[ ] Staff user cannot PATCH /api/organisations/current.
[ ] Administer user can update organisation name, legal name, country, timezone, and currency.
[ ] Blank organisation name is rejected.
[ ] Blank country is rejected.
[ ] Blank timezone is rejected.
[ ] Blank currency is rejected.
[ ] Non-owner user cannot change organisation status.
[ ] Organisation closure is blocked because offboarding is deferred.
[ ] Organisation profile update creates an ORGANISATION_UPDATED audit log.
[ ] Organisation settings update creates an ORGANISATION_SETTINGS_UPDATED audit log.
```

## Licensing Management

```text
[ ] Logged-out user cannot access /api/licensing.
[ ] User without Licensing/View cannot access /api/licensing.
[ ] User without Licensing/Administer cannot create a license.
[ ] Administer user can create a license for the current organisation.
[ ] License creation creates a LICENSE_CREATED audit log.
[ ] Module allocation is scoped to current organisation license only.
[ ] Module allocation creates LICENSE_MODULE_ALLOCATED audit log.
[ ] User allocation rejects users outside the current organisation.
[ ] User allocation creates LICENSE_USER_ALLOCATED audit log.
[ ] Device allocation rejects devices outside the current organisation.
[ ] Device allocation creates LICENSE_DEVICE_ALLOCATED audit log.
[ ] License status update creates LICENSE_STATUS_CHANGED audit log.
[ ] License expiry update creates LICENSE_EXPIRY_UPDATED audit log.
[ ] Consumption endpoint returns module, used user, allocated seat, and device allocation counts.
```

## Regression Checks

```text
[ ] Existing login route still works.
[ ] Existing logout route still works.
[ ] Existing user management APIs still exist.
[ ] Existing environment switch APIs still exist.
[ ] Existing device activation APIs still exist.
[ ] Public Wave 4 website files remain untouched.
[ ] No live CRM/Inventory/POS business logic has been introduced.
```
