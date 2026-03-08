# Auth

Last updated: 2026-03-07

## Purpose

Handle registration, login, JWT authentication, store access, and store switching.

## Current Status

- Status: `done`

## What Exists

- Supabase-backed auth flow in backend
- JWT-protected API access
- Multi-store login response and store switching
- Frontend auth service, auth guard, and token header injection
- Tenant header propagation through frontend interceptor chain

## Known Gaps

- No separate launch blocker inside auth itself
- Production readiness still depends on deployment and environment configuration outside this area

## Recent Decisions

- Frontend auth interceptor no longer logs token details to the browser console

## Dependencies / Cross-Cutting Notes

- Depends on store membership and tenant guards
- Billing/subscription context is enforced after auth for tenant controllers

## Next Actions

- Keep behavior stable while deployment and launch hardening continue

## Validation / Evidence

- Backend auth endpoints and guards in `backend/src/auth` and `backend/src/common/guards`
- Frontend auth service and interceptors in `frontend/src/app/core`
- Frontend auth and interceptor specs are passing

## Last Updated

- 2026-03-07
