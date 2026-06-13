# Production Readiness Architecture

## Deployment Model

Recommended initial deployment model:

```text
Public Website
  Static hosting / CDN

Invyra Platform App
  Next.js app runtime
  API routes
  PostgreSQL database
  Secure environment variables
  Server-side sessions
```

## Environment Model

Use separate runtime environments:

```text
Development
Staging
Production
```

Within the product itself, continue to enforce tenant data environments:

```text
LIVE
TRAINING
TEST
```

These are not the same thing.

- Development / Staging / Production = deployment/runtime environments
- LIVE / TRAINING / TEST = customer operational data environments

## Recommended Hosting Requirements

Minimum production requirements:

- Node.js 20+
- PostgreSQL 15+
- TLS/HTTPS only
- Secret manager or protected environment variables
- Automated database backups
- Centralized application logs
- Error monitoring
- Deployment rollback support
- Readiness/health checks

## Production Entry Gates

Production deployment should not proceed unless:

- `npm run doctor` passes
- `npm run verify:phase3` passes
- `npm run typecheck` passes
- `npm run build` passes
- Prisma migration succeeds in staging
- Seed runs safely without duplicate pollution
- Login/logout flow works in staging
- Tenant isolation verification passes in staging
- Backup and restore process is tested
