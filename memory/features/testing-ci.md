# Testing & CI

Last updated: 2026-03-07

## Purpose

Provide confidence through unit, integration, feature, and browser tests, and run them automatically in CI.

## Current Status

- Status: `done`

## What Exists

- Backend unit tests
- Backend registration-to-first-sale E2E
- DB-backed sales integration tests
- Frontend Vitest infrastructure and core-layer coverage
- Frontend feature-level tests for dashboard, POS, customers, and products
- GitHub Actions CI for backend/frontend build and tests
- Separate Playwright workflow for isolated Supabase E2E with guarded reset/seed flow

## Known Gaps

- No deployment smoke gate exists yet
- Feature breadth in Playwright can still expand if needed
- Integration tests are opt-in locally because they require `TEST_DATABASE_URL`

## Recent Decisions

- Sales integration gaps previously noted in docs are no longer real repo gaps
- Browser E2E remains separate from PR CI because it depends on protected secrets and DB reset

## Dependencies / Cross-Cutting Notes

- CI is present, but CD is not
- Playwright workflow depends on the dedicated E2E Supabase environment and secrets

## Next Actions

- Add deploy-smoke checks once deployment exists

## Validation / Evidence

- `.github/workflows/ci.yml`
- `.github/workflows/e2e-playwright.yml`
- `backend/test/sales.integration-spec.ts`
- `backend/test/registration-first-sale.e2e-spec.ts`
- `frontend/tests/e2e`

## Last Updated

- 2026-03-07
