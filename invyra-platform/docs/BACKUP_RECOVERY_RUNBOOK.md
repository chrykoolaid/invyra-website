# Backup and Recovery Runbook

## Backup Objectives

Recommended baseline:

```text
Production database backup frequency: daily minimum
Point-in-time recovery: preferred
Retention: 30 days minimum for early production
Critical audit retention: longer-term archive later
```

## Backup Scope

Back up:

- PostgreSQL database
- Prisma migration history
- Environment configuration references
- Audit logs
- User/session security records
- Organisation/licensing/device records

Do not back up plaintext secrets into the repository.

## Restore Procedure

1. Identify recovery point.
2. Freeze affected deployment if data integrity is at risk.
3. Restore database to isolated recovery environment first.
4. Run Prisma validation.
5. Confirm organisation scoping still works.
6. Confirm LIVE / TRAINING / TEST separation.
7. Confirm audit logs are readable.
8. Promote restored database only after validation.
9. Record incident and recovery audit note.

## Disaster Recovery Priority

Priority order:

```text
1. Authentication and organisation access
2. Audit logs and security records
3. Licensing and device activation
4. Onboarding records
5. Future module data
```

## Non-Negotiable Rule

Never restore TEST or TRAINING records into LIVE without an explicit controlled migration plan.
