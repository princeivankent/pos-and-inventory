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
- Frontend component tests are still pending.

## Recommended Next Work Items

1. Add integration tests for `voidSale` stock restoration and credit balance reversal.
2. Add integration tests for inventory stock-out FIFO edge cases.
3. Add CI workflow step to run `test`, `test:e2e`, and `test:integration` (with test DB service).
4. Start frontend feature-level component tests for billing and sales pages.
