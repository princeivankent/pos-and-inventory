# Phase 10 Testing Handoff

This document is the current source of truth for automated testing added during Phase 10.

## Scope Implemented

### Backend Unit Tests
- `backend/src/common/guards/tenant.guard.spec.ts`
  - Rejects unauthenticated requests.
  - Rejects missing `X-Store-Id`.
  - Injects tenant context (`storeId`, `role`, `permissions`) when access is valid.
- `backend/src/sales/sales.service.spec.ts`
  - Rejects product not found in tenant store.
  - Rejects insufficient FIFO batch quantity.
  - Verifies FIFO batch allocation and stock deductions on successful sale.

### Backend E2E Tests
- `backend/test/registration-first-sale.e2e-spec.ts`
  - Registration -> first sale happy path.
  - Tenant access denial (`403`) when using unauthorized store.
  - Stock-in then FIFO sale allocation assertions.
  - Insufficient stock after prior sale returns `400`.

### Backend Integration (DB-backed) Scaffold
- `backend/test/sales.integration-spec.ts`
  - Real TypeORM + Postgres integration tests for `SalesService`.
  - Per-run isolated schema creation and cleanup.
  - FIFO deduction against real repositories.
  - Tenant isolation check across two stores.

## Test Config and Scripts

### Jest Config Files
- `backend/test/jest-e2e.json`
- `backend/test/jest-integration.json`

### NPM Scripts (backend)
- `npm run test`
- `npm run test:e2e`
- `npm run test:integration`

## How To Run

From `backend/`:

```bash
npm run test -- --runInBand
npm run test:e2e -- --runInBand
```

For integration tests, set a dedicated test database URL first:

```bash
# PowerShell example
$env:TEST_DATABASE_URL="postgresql://user:password@localhost:5432/pos_test"
npm run test:integration
```

Notes:
- Integration tests are intentionally skipped when `TEST_DATABASE_URL` is not set.
- Use a disposable database for `TEST_DATABASE_URL`.

## Current Limitations

- Current e2e tests use controlled service doubles for deterministic API flow coverage, not full `AppModule` external infra wiring.
- Integration tests are opt-in and require local/CI Postgres availability.
- Frontend component tests for dashboard, POS, products, and customers are now in place.

## Recommended Next Work Items

1. Run backend integration tests in CI with a dedicated Postgres test database.
2. Add feature-level frontend component tests for billing and sales pages.
3. Expand Playwright coverage for reports, settings, and supplier management.
4. Add production smoke execution to deployment gates.

---

## Frontend Testing (Phase 10 — Core Layer)

### Infrastructure

| Item | Status |
|---|---|
| Install `vitest` + `@vitest/coverage-v8` | [x] Done |
| `tsconfig.spec.json` — `"types": ["vitest/globals"]` | [x] Already present |
| `angular.json` — `test` architect target with `@angular/build:unit-test` | [x] Done |

### Core Layer Test Files

| File | Status |
|---|---|
| `src/app/shared/pipes/php-currency.pipe.spec.ts` | [x] 9 tests |
| `src/app/features/pos/services/cart.service.spec.ts` | [x] 34 tests |
| `src/app/core/guards/auth.guard.spec.ts` | [x] 2 tests |
| `src/app/core/guards/role.guard.spec.ts` | [x] 2 tests |
| `src/app/core/interceptors/auth.interceptor.spec.ts` | [x] 3 tests |
| `src/app/core/interceptors/tenant.interceptor.spec.ts` | [x] 4 tests |
| `src/app/core/interceptors/error.interceptor.spec.ts` | [x] 12 tests |
| `src/app/core/services/subscription.service.spec.ts` | [x] 23 tests |
| `src/app/core/services/store-context.service.spec.ts` | [x] 15 tests |
| `src/app/core/services/auth.service.spec.ts` | [x] 16 tests |

### Feature Layer Tests (Future)

| File | Status |
|---|---|
| Dashboard component tests | [x] |
| POS component tests | [x] |
| Customers component tests | [x] |
| Products component tests | [x] |

### Playwright E2E Coverage

| Suite | Status |
|---|---|
| Billing and permissions (`tests/e2e/billing-permissions.spec.ts`) | [x] 3 tests passing |
| Smoke flows (`tests/e2e/smoke.spec.ts`) | [x] 3 tests passing |

### Playwright Notes

- Playwright now starts both the backend (`backend/npm run start:dev`) and frontend (`frontend/npm run start`) from `frontend/playwright.config.ts`.
- Browser prerequisite: `npx playwright install chromium`
- Sale-number collision fix applied:
  - Migration: `backend/src/database/migrations/1707900000000-FixSaleNumberUniqueness.ts`
  - Uniqueness is now scoped to `(store_id, sale_number)`

### How To Run (Frontend)

```bash
cd frontend
npm run test                        # run all spec files
npm run test -- --reporter=verbose  # verbose output per test
npm run test:e2e                    # run Playwright suites (starts backend + frontend)
```
