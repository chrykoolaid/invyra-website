# Inventory Schema Activation Implementation — Phase 2E

## Purpose

Activate the Inventory schema so the portal can move from contract-only backend planning toward read-only data service wiring.

## Activated Scope

The activated schema covers:

- locations
- item master
- stock balances
- movement ledger
- suppliers
- supplier-item mapping
- purchase order headers and lines
- receiving batches and lines
- inventory configuration
- import batches and rows

## Tenant / Environment Pattern

Every Inventory operational model contains:

- `organisationId`
- `environmentName`

This keeps LIVE, TRAINING, and TEST data separated at query-contract level.

## Relation Strategy

Phase 2E intentionally uses scalar tenant and cross-record IDs rather than adding Prisma relation fields back into existing platform models. This avoids broad refactoring of existing auth, organisation, device, user, and audit models during schema activation.

Formal relation hardening can be scoped later after the first read-only data services are stable.

## Writes Remain Disabled

Schema activation does not mean operational Inventory is live. All mutation flows remain disabled until explicit write phases are scoped.
