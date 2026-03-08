# Products

Last updated: 2026-03-07

## Purpose

Manage the product catalog, pricing, stock metadata, and search/filter flows.

## Current Status

- Status: `done`

## What Exists

- Backend CRUD with store scoping, soft delete, search, and category filtering
- Frontend products list with table/card views, dialogs, and category filtering
- Support for SKU and barcode fields
- Plan-limit enforcement is available through billing guards

## Known Gaps

- Barcode scanning hardware flow is intentionally not built
- Data export and other advanced product operations are still future work

## Recent Decisions

- Products are treated as launch-ready within current scope

## Dependencies / Cross-Cutting Notes

- Product creation and limits intersect with subscription usage controls
- Inventory and sales both depend on product correctness

## Next Actions

- Keep stable

## Validation / Evidence

- `backend/src/products`
- `frontend/src/app/features/products`
- Product feature spec coverage in frontend tests

## Last Updated

- 2026-03-07
