# Frontend Shell

Last updated: 2026-03-07

## Purpose

Provide the shared Angular app shell, route protection, interceptors, layout, and production build behavior.

## Current Status

- Status: `done`

## What Exists

- Angular 21 standalone app with lazy feature routes
- Shared layout shell with sidebar and header
- Auth, tenant, and error interceptors
- Auth and role guards
- Production build configuration now uses `environment.prod.ts`

## Known Gaps

- Frontend initial production bundle still exceeds the warning budget
- No deployment-specific runtime config strategy is implemented in-repo

## Recent Decisions

- Production billing behavior must come from prod environment config, not dev defaults
- Token logging in the auth interceptor is treated as unacceptable in production

## Dependencies / Cross-Cutting Notes

- Every frontend feature depends on interceptor and route-guard correctness
- Billing UI behavior depends on environment settings and backend payment configuration

## Next Actions

- Reduce bundle size where the payoff is clear
- Keep interceptor behavior aligned with backend contract changes

## Validation / Evidence

- `frontend/angular.json`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/core/interceptors/*.ts`
- Frontend build and tests pass locally

## Last Updated

- 2026-03-07
