# Invyra Portal Login Workflow Recovery v1

## Gate Finding

The previous website portal page was mostly a marketing/explainer page. It did not look or behave like a customer portal front door and did not expose the login/recovery/device workflow clearly enough.

## Recovery Implemented

### Public Website

- Rebuilt `/portal/index.html` as a secure Inventory portal entry page.
- Added visible login card and workflow path.
- Added clear actions for:
  - Sign in to Inventory Portal
  - Forgot password
  - Device activation
  - Request Inventory access
- Added access gate explanation:
  - Login
  - Organisation
  - Licence
  - Device
  - Environment
  - Role
- Added a portal workspace preview with sidebar, topbar, workflow cards, licence/device/environment status, and future-module locks.
- Updated static navigation button `Inventory Portal` to point to `/app/` instead of looping back to `/portal/`.

### Static Portal Preview

- Rebuilt `/app/index.html` as a portal login page.
- Added `/app/login.html`.
- Rebuilt `/app/dashboard.html` as an Inventory portal dashboard preview.
- Added `/app/forgot-password.html`.
- Rebuilt `/app/reset.html`.
- Added `/app/device-activation.html`.
- Rebuilt `/app/request-access.html`.
- Added `/app/thanks.html`.
- Added root compatibility redirects for `/login/`, `/forgot-password/`, `/reset-password/`, and `/activate/`.

### Protected Next Platform

- Enhanced `/login` UI copy to show the actual portal gate sequence.
- Enhanced `/forgot-password` UI.
- Enhanced `/reset-password` UI.
- Confirmed protected auth API route presence:
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/session`
  - `/api/auth/forgot-password`
  - `/api/auth/reset-password`
- Confirmed middleware protects `/portal/*` by redirecting unauthenticated users to `/login`.

## Verification

New script added:

```bash
npm run verify:portal-login-workflows
```

Combined UX + Inventory structure check:

```bash
npm run verify:portal-ux
```

## Status

The website now has a visible portal front door and login workflow layer.

This is still not a production-auth deployment certification. It is a portal UX and workflow coverage recovery so the website no longer appears like a brochure-only page.
