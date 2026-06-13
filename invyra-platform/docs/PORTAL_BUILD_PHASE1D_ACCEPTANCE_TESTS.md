# Portal Build Phase 1D Acceptance Tests

## Baseline

Build under test:

```text
invyra_website_portal_phase1d_permission_visibility_v1.zip
```

## Required command

```bash
cd invyra-platform
npm run verify:portal-phase1d
```

Expected result:

```text
Portal Phase 1D verification passed.
```

## Manual acceptance checks

### PortalShell navigation

Expected:

```text
- Inventory group appears first
- Restricted workflow links show Restricted and are not normal clickable links
- Licence-required links route to Licensing
- CRM shows Coming Later
- POS shows Coming Later
- Forecasting shows Roadmap
```

### Portal Home

Expected:

```text
- Inventory remains the only active commercial module
- Platform Foundation cards show Available / Restricted / Licence Required
- CRM and POS do not show Open or Launch actions
- Future roadmap modules remain secondary
```

### Inventory Dashboard

Expected:

```text
- Workflow cards show required access level
- INVENTORY.VIEW routes are available to users with Inventory view access
- Inventory Settings/Admin shows Restricted unless the user has INVENTORY.ADMINISTER
- Backend data is not faked
```

### Inventory workflow route

Expected:

```text
- Direct route access is still protected by canAccessModule(...)
- Nearby route links respect visibility state
- Restricted routes are labelled instead of shown as normal links
```

### Licensing page

Expected:

```text
- Direct access requires LICENSING.VIEW
- Inventory may open only when visible as Available
- CRM and POS remain Coming Later
- Roadmap modules do not show Open / Launch
```

### Admin routes

Expected:

```text
- Tenant Verification uses the current PortalShell signature
- Organisation admin requires ADMINISTRATION.VIEW
- Onboarding admin requires ADMINISTRATION.VIEW
```

## Non-goals

Do not fail this phase because these are not included yet:

```text
- Live Inventory database tables
- CRUD actions
- Real stock figures
- Receiving mutations
- Order submission
- CRM/POS operational dashboards
```
