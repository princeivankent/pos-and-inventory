# Sales

Last updated: 2026-03-07

## Purpose

Run checkout, create sales atomically, manage FIFO deductions, handle voids, and preserve financial/inventory correctness.

## Current Status

- Status: `done`

## What Exists

- Atomic sale creation with FIFO batch deduction
- Support for cash, credit, and partial-credit flows
- Daily sales listing and sale detail retrieval
- Admin void flow with stock restoration
- Store-scoped sale-number uniqueness
- Frontend POS and sales history flows

## Known Gaps

- No dedicated returns/refunds module beyond current void/manual handling
- Thermal printing is still outside the completed sales workflow

## Recent Decisions

- Store-scoped sale-number uniqueness replaced the earlier global uniqueness problem
- Sales integration coverage is considered real and present, not pending

## Dependencies / Cross-Cutting Notes

- Depends on products, inventory, customers, and auth/tenant enforcement
- Receipt and printing flows sit adjacent to, but not fully inside, sales completion

## Next Actions

- Keep stable
- Expand higher-value E2E only where it lowers launch risk

## Validation / Evidence

- `backend/src/sales`
- `backend/test/sales.integration-spec.ts`
- `backend/test/registration-first-sale.e2e-spec.ts`
- `frontend/tests/e2e/smoke.spec.ts`

## Last Updated

- 2026-03-07
