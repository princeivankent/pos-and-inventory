# Reports

Last updated: 2026-03-07

## Purpose

Provide sales, inventory, best-selling, and profit visibility for stores with eligible plans.

## Current Status

- Status: `done`

## What Exists

- Backend report endpoints for sales, inventory, best-selling, and profit
- Frontend reports page with charts and empty states
- Admin-only access plus subscription feature gating
- Dashboard and reports UI gracefully skip blocked APIs where needed

## Known Gaps

- No export workflow is implemented yet
- Performance tuning may still be needed for heavier production datasets

## Recent Decisions

- Reports are treated as a gated premium capability rather than universal functionality

## Dependencies / Cross-Cutting Notes

- Depends on completed sales and inventory data
- Subscription feature gates control availability

## Next Actions

- Keep stable and optimize only if production data volume requires it

## Validation / Evidence

- `backend/src/reports`
- `frontend/src/app/features/reports`
- Dashboard/report tests and gated behavior coverage

## Last Updated

- 2026-03-07
