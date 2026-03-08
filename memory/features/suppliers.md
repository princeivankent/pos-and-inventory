# Suppliers

Last updated: 2026-03-07

## Purpose

Manage supplier records and connect them to inventory stock-in and movement visibility.

## Current Status

- Status: `done`

## What Exists

- Backend supplier CRUD with `is_active` support
- Admin-only supplier permissions
- Stock-in linkage to optional supplier IDs
- Supplier-aware movement data
- Frontend supplier management screens and route

## Known Gaps

- No purchase-order workflow exists
- No supplier analytics or reorder system exists

## Recent Decisions

- Supplier management is complete for current launch scope

## Dependencies / Cross-Cutting Notes

- Primarily intersects with inventory stock-in flows

## Next Actions

- Keep stable

## Validation / Evidence

- `backend/src/suppliers`
- `frontend/src/app/features/suppliers`
- `docs/features/supplier-management.md`

## Last Updated

- 2026-03-07
