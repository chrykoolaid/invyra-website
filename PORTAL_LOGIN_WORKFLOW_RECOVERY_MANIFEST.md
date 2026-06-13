# Portal Login Workflow Recovery Manifest v1

## Package

`invyra_website_portal_login_workflow_recovery_v1.zip`

## Purpose

Fix the gap where the public website portal did not look like a customer portal and did not visibly expose login, password recovery, access request, device activation, and dashboard entry workflows.

## Files changed / added

- `portal/index.html`
- `app/index.html`
- `app/login.html`
- `app/dashboard.html`
- `app/forgot-password.html`
- `app/reset.html`
- `app/device-activation.html`
- `app/request-access.html`
- `app/thanks.html`
- `login/index.html`
- `forgot-password/index.html`
- `reset-password/index.html`
- `activate/index.html`
- `styles.css`
- `app/portal.css`
- `invyra-platform/app/login/page.tsx`
- `invyra-platform/app/forgot-password/page.tsx`
- `invyra-platform/app/reset-password/page.tsx`
- `invyra-platform/app/globals.css`
- `invyra-platform/scripts/verify-portal-login-workflows.mjs`
- `invyra-platform/package.json`
- `PORTAL_LOGIN_WORKFLOW_RECOVERY_REPORT.md`
- `invyra-platform/docs/PORTAL_LOGIN_WORKFLOW_RECOVERY_REPORT.md`

## Verification command

```bash
cd invyra-platform
npm run verify:portal-login-workflows
npm run verify:portal-ux
```

## Gate Status

Portal login workflow visual/presence recovery: COMPLETE.
