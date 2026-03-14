# Auth

Last updated: 2026-03-15

## Purpose

Handle registration, login, JWT authentication, store access, store switching, password reset, and profile management.

## Current Status

- Status: `done`

## What Exists

- Supabase-backed auth flow in backend
- JWT-protected API access
- Multi-store login response and store switching
- Frontend auth service, auth guard, and token header injection
- Tenant header propagation through frontend interceptor chain
- **Forgot password flow** — token generation (1-hr expiry), EmailJS email delivery, reset via Supabase admin API
- **Profile management** — update `full_name`, read-only email display with avatar initials
- **Change password** — verifies current password via Supabase sign-in before updating

## Backend Endpoints (auth)

| Method | Path | Guard | Purpose |
|--------|------|-------|---------|
| POST | `/auth/forgot-password` | public | Generate reset token, return link for EmailJS |
| POST | `/auth/reset-password` | public | Validate token, update Supabase password |
| PATCH | `/auth/profile` | JWT | Update `full_name` |
| POST | `/auth/change-password` | JWT | Verify current + set new password |

## Frontend Pages / Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/forgot-password` | `features/auth/forgot-password` | public |
| `/reset-password?token=xxx` | `features/auth/reset-password` | public |
| `/profile` | `features/profile` | authGuard |

## Email Delivery

- Provider: **EmailJS** (`@emailjs/browser` — frontend-side)
- Credentials in `frontend/src/environments/environment.ts` and `environment.prod.ts`
- Template variables: `{{to_name}}`, `{{to_email}}`, `{{reset_link}}`
- Backend returns `reset_link`, `user_name`, `user_email` from `POST /auth/forgot-password` for the frontend to call EmailJS

## Database

- Migration `1709000000000-AddPasswordResetToken.ts` adds `password_reset_token VARCHAR(255)` and `password_reset_expires_at TIMESTAMP` to `users` table

## Known Gaps

- No separate launch blocker inside auth itself

## Recent Decisions

- Frontend auth interceptor no longer logs token details to the browser console
- Reset link uses `FRONTEND_URL` env var on the backend (falls back to `http://localhost:4200`)
- Email enumeration protection: `POST /auth/forgot-password` always returns generic success even if email not found

## Dependencies / Cross-Cutting Notes

- Depends on store membership and tenant guards
- Billing/subscription context is enforced after auth for tenant controllers
- Header user name is a `[routerLink]="/profile"` link

## Next Actions

- Keep behavior stable

## Validation / Evidence

- Backend: `backend/src/auth/` — service, controller, 4 new DTOs
- Frontend: `frontend/src/app/features/auth/forgot-password/`, `reset-password/`, `features/profile/`
- EmailJS configured and tested end-to-end (Mar 15, 2026)

## Last Updated

- 2026-03-15
