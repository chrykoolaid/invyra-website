# Phase 3 Production Readiness Checklist

## Platform Checks

- [ ] Public website and platform app are separated
- [ ] Platform environment variables are documented
- [ ] Database connection is configured
- [ ] Prisma generate works
- [ ] Prisma migration works
- [ ] Seed is idempotent
- [ ] Typecheck passes
- [ ] Production build passes

## Security Checks

- [ ] Login is server-side enforced
- [ ] Portal routes are protected
- [ ] Organisation scoping is enforced
- [ ] LIVE / TRAINING / TEST separation is enforced
- [ ] Role permissions are enforced
- [ ] License access is enforced
- [ ] Device status is enforced where required
- [ ] Access denied events are audit logged

## Operations Checks

- [ ] Backup plan exists
- [ ] Restore procedure exists
- [ ] Monitoring plan exists
- [ ] Logging plan exists
- [ ] Release runbook exists
- [ ] Rollback plan exists
- [ ] Incident response ownership is defined

## Wave 5 Lock Gate

Wave 5 can be considered complete after this checklist is reviewed and the local runtime build has passed.
