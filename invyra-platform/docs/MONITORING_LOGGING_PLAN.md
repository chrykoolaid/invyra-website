# Monitoring and Logging Plan

## Application Monitoring

Monitor:

- Login success/failure rates
- Session creation and expiry rates
- Access denied spikes
- API error rates
- Database connection failures
- Prisma migration failures
- Device activation failures
- License access denials
- Environment switch events

## Security Monitoring

Alert on:

- Repeated failed login attempts
- Suspended users attempting access
- Deactivated users attempting login
- Cross-organisation access attempts
- License bypass attempts
- Suspended device activity
- Unexpected admin role changes
- High volume access denied events

## Log Categories

```text
Application logs
Security logs
Audit logs
Access-denied logs
Session logs
Device logs
License logs
Onboarding logs
```

## Retention Guidance

Early production baseline:

```text
Application logs: 30 days
Security logs: 90 days minimum
Audit logs: 1 year preferred
Access-denied logs: 1 year preferred
```

Formal compliance retention can be expanded later.
