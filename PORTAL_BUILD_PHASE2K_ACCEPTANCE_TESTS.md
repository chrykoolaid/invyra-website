# Invyra Portal Build — Phase 2K Acceptance Tests

## Phase

Phase 2K — Inventory Read-only Demo Portal UX QA

## Required Checks

- Inventory Dashboard displays a read-only demo UX QA banner.
- Read-only summary reports Phase 2K.
- Table components show demo-specific labels, not vague operational status only.
- Tables include a clear read-only demo UX review note.
- Seeded rows remain display-only.
- Empty demo states remain honest if no rows exist.
- Workflow tables use the same demo UX review language.
- No create, update, delete, upload, import commit, or stock mutation routes are added.
- CRM and POS remain non-operational future modules.

## Verification Command

```bash
npm run verify:portal-phase2k
```

## Expected Result

```text
Portal Phase 2K verification passed.
Phase 2K read-only demo portal UX QA checks passed.
```
