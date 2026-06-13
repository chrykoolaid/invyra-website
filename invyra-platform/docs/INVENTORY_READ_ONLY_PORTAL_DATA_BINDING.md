# Inventory Read-only Portal Data Binding

## Purpose

Phase 2G connects the protected Inventory portal pages to the existing read-only Inventory API/service contract. This is display-only binding.

## Bound Portal Areas

| Portal Area | Binding |
|---|---|
| Inventory Dashboard | Readiness counts and preview tables |
| Items | Read-only item rows |
| Suppliers | Read-only supplier rows |
| Movements | Read-only movement rows |
| Settings/Admin | Read-only configuration rows, admin-visible only |
| Other workflows | Read-only backend readiness summary only |

## Data Scope

All displayed data remains scoped by:

- Organisation ID
- Environment name: LIVE, TRAINING, or TEST
- Inventory licence entitlement
- Inventory permission level

## Limits

The read-only service keeps the Phase 2F limit:

```text
100 records maximum per collection request
```

Portal previews display a smaller subset where appropriate.

## Non-goals

Phase 2G does not enable:

- Create
- Edit
- Delete
- Upload
- Import preview
- Import commit
- Stock mutation
- Purchase order mutation
- Receiving mutation
- Wastage mutation
- Stocktake posting

## UX Rule

When rows exist, show read-only rows clearly.

When rows do not exist, show honest empty states that explain:

- The route is protected.
- The service is read-only.
- No rows exist for the current organisation/environment.
- The next safe action is preparation, not mutation.
