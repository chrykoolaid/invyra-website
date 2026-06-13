# Seeded Role Verification — Wave 5 Phase 1G

## Purpose

The seeded role verifier proves that the first platform foundation roles are created consistently and that the permission matrix matches the Wave 5 design intent.

## Command

```bash
npm run verify:seeded-roles
```

Run this after:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name wave5_phase1g_runtime_readiness
npm run db:seed
```

## Verified Users

| Role | Login |
|---|---|
| Owner | owner@invyra.local |
| Administrator | admin@invyra.local |
| Manager | manager@invyra.local |
| Supervisor | supervisor@invyra.local |
| Staff | staff@invyra.local |

## Permission Matrix

### Owner

```text
All modules
View, Create, Edit, Approve, Administer
```

### Administrator

```text
All modules
View, Create, Edit, Approve, Administer
```

Administrator has broad seeded access for the platform foundation but ownership transfer remains deferred to a future governance workflow.

### Manager

```text
CRM, Inventory, POS: View, Create, Edit, Approve
Licensing, Devices, Administration: View
```

### Supervisor

```text
CRM, Inventory, POS: View, Create, Edit, Approve
No Licensing, Devices, or Administration permissions
```

### Staff

```text
CRM, Inventory, POS: View, Create
No Licensing, Devices, or Administration permissions
```

## Environment Access

The verifier confirms each seeded membership has access to:

```text
LIVE
TRAINING
TEST
```

This is a foundation check only. Future live module waves must still enforce environment-scoped business data queries.

## Licensing Check

The verifier confirms the seeded organisation has an active demo license:

```text
invyra_demo_platform_license
```

and active module entitlements for:

```text
CRM
Inventory
POS
Licensing
Devices
Administration
```
