# Phase 2F Acceptance Tests — Read-only Inventory Data Service Wiring

## Required checks

- `lib/inventory/inventory-read-only-service.ts` exists.
- Read-only service uses Prisma `findMany` / `count` only.
- Read-only service does not use create, update, upsert, delete, createMany, updateMany, or deleteMany.
- API helper reports `INVENTORY_READ_ONLY_API_PHASE = "2F"`.
- API helper reports `read_only_data_service_wired`.
- API route handlers await async payload builders.
- Tenant scope uses `organisationId`.
- Environment scope uses `environmentName`.
- Configuration route remains ADMINISTER-protected.
- Items, suppliers, movements, and readiness remain VIEW-protected.
- No upload/write/import commit routes exist.

## Verification command

```bash
cd invyra-platform
npm run verify:portal-phase2f
```

## Expected result

```text
Portal Phase 2F verification passed.
Phase 2F read-only Inventory data service wiring checks passed.
```
