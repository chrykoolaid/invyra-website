# PORTAL DEMO CREDENTIALS RECOVERY REPORT v1

## Status

Implemented.

## Reason

The portal login preview existed, but the user had no credentials to enter the portal. That made the portal impossible to inspect as a practical login workflow.

## Added Demo Credentials

These are static, non-production preview credentials only.

| Role | Email | Password | Default Environment |
|---|---|---|---|
| Owner | owner@demo.invyra | InventoryDemo#2026 | LIVE |
| Manager | manager@demo.invyra | InventoryDemo#2026 | TRAINING |
| Staff | staff@demo.invyra | InventoryDemo#2026 | TRAINING |

## Added Workflow Behaviour

- Login page now visibly displays demo accounts.
- Clicking a demo account fills the login form.
- Login validates the demo email/password in static preview mode.
- Successful login writes a local preview session to browser localStorage.
- Dashboard reads the local preview session and shows organisation, role, environment, and device context.
- Dashboard now has logout.
- Direct dashboard access without a local session redirects back to login with a visible notice.

## Production Warning

These credentials must never be treated as production credentials. Production authentication must use the protected auth API/session layer and real tenant-user records.
