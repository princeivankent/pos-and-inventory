# Inventory

Last updated: 2026-03-07

## Purpose

Track stock, batches, FIFO availability, movements, and low-stock visibility.

## Current Status

- Status: `done`

## What Exists

- Backend stock adjustment flow with inventory batches and stock movements
- FIFO-aware stock deduction support for sales
- Low-stock endpoint and frontend views
- Inventory overview and movement history in frontend

## Known Gaps

- No expiry-warning automation is implemented
- No reorder workflow exists yet

## Recent Decisions

- Inventory is functionally complete for manual operational use
- Low-stock automation is now live (Mar 15, 2026) — see [low-stock-alerts.md](./low-stock-alerts.md)

## Dependencies / Cross-Cutting Notes

- Sales correctness depends on inventory batch correctness
- Supplier stock-in integrates with inventory batches

## Next Actions

- Add expiry-warning automation if needed
- Consider reorder workflow (purchase order generation)

## Validation / Evidence

- `backend/src/inventory`
- `frontend/src/app/features/inventory`
- Sales integration tests cover FIFO rollback behavior
- Playwright smoke flow covers stock-in

## Last Updated

- 2026-03-15
