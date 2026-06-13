# 🔒 Invyra Website Wave 5 Phase 1I — Build Notes

## Scope

Phase 1I is a local install error-fix pass and first runtime debug cycle preparation pass.

This pass does not add CRM, Inventory, POS, billing, integrations, AI services, marketplace, or mobile functionality.

## Added

- Local install doctor script
- Phase 1I static verifier
- First Runtime Debug Cycle guide
- Local Install Troubleshooting guide
- Pinned dependency versions instead of `latest`
- Node.js / npm engine requirements
- Updated package scripts
- Updated README guidance

## Why This Matters

The previous phases created the platform foundation structurally. Phase 1I reduces the chance of local setup failures by checking the local runtime before migrations and by documenting the first debug cycle.

## Locked Runtime Assumption

- Node.js 20 LTS or newer
- npm 10 or newer
- PostgreSQL database
- Prisma migration flow
- Next.js platform app remains separate from the Wave 4 public static website
