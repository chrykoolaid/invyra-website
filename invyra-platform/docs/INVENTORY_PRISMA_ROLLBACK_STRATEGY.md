# Inventory Prisma Rollback Strategy

## Purpose

Define how to recover safely if Inventory schema activation causes local runtime or migration issues.

## Development Rollback

For local development only:

1. Stop the Next.js server.
2. Revert `prisma/schema.prisma` to the previous accepted baseline.
3. Remove the generated Inventory migration folder if it has not been shared or deployed.
4. Reset the local database only if acceptable for the local environment.
5. Run `npx prisma generate`.
6. Run the Phase 2D through Phase 1M verification chain.

## Shared Environment Rollback

For any shared or deployed environment:

- Do not delete migrations casually.
- Create an explicit rollback migration only after review.
- Preserve auditability of schema change decisions.
- Confirm no live Inventory customer data exists before destructive actions.

## Rollback Acceptance

Rollback is acceptable only if:

- Authentication still works.
- Organisation context still works.
- Licence checks still work.
- Environment awareness still works.
- Portal routes still render.
- CRM/POS remain future-only.
