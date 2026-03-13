# Project Memory Index

Last updated: 2026-03-14 (subscription plan refinement)

## Overall State

- Stage: pre-launch (deployed to production, not yet open to real customers)
- Operational source of truth: this `memory/` folder
- Overall status: core POS, inventory, credit, suppliers, billing, CI, Playwright E2E, and production deployment are all live
- Main remaining launch blockers: thermal printer path, low-stock automation, PayMongo live keys (business verification), frontend bundle warning

## Production URLs

- Frontend: https://pos-and-inventory-seven.vercel.app
- Backend: https://pos-and-inventory-production.up.railway.app

## Launch Blockers

- Thermal printing is not wired to real POS hardware flows (hardware not yet purchased)
- Low-stock automation exists only as views/endpoints, not cron + notification flow (next up)
- Frontend production bundle is above the warning budget
- Supabase: intentionally sharing dev DB for now, split before scaling to real customers

## Resolved Blockers

- PayMongo live keys configured in Railway (Mar 13, 2026)

## Feature Matrix

| Area | Status | Confidence | Last Updated | Next Action |
|------|--------|------------|--------------|-------------|
| [Auth](./features/auth.md) | `done` | `verified` | 2026-03-07 | Keep stable |
| [Frontend Shell](./features/frontend-shell.md) | `done` | `verified` | 2026-03-07 | Trim bundle size and keep guards/interceptors aligned |
| [Products](./features/products.md) | `done` | `verified` | 2026-03-07 | Keep stable |
| [Inventory](./features/inventory.md) | `done` | `verified` | 2026-03-07 | Add low-stock automation |
| [Sales](./features/sales.md) | `done` | `verified` | 2026-03-07 | Keep stable and expand higher-value E2E coverage |
| [Receipts & Printing](./features/receipts-printing.md) | `in_progress` | `verified` | 2026-03-07 | Define and wire the real thermal-print path |
| [Customers](./features/customers.md) | `done` | `verified` | 2026-03-07 | Keep stable |
| [Suppliers](./features/suppliers.md) | `done` | `verified` | 2026-03-07 | Keep stable |
| [Reports](./features/reports.md) | `done` | `verified` | 2026-03-07 | Keep stable and optimize where needed |
| [Billing & Subscriptions](./features/billing-subscriptions.md) | `done` | `verified` | 2026-03-14 | Complete live-payment rollout and production validation |
| [Testing & CI](./features/testing-ci.md) | `done` | `verified` | 2026-03-07 | Add deployment smoke coverage and broader feature E2E where valuable |
| [Deployment](./features/deployment.md) | `done` | `verified` | 2026-03-13 | Split prod/dev Supabase, complete PayMongo live rollout |

## Current Top Priorities

- Wire thermal printing for real POS environments
- Automate low-stock detection and surface it in workflow-friendly ways
- Complete live PayMongo rollout validation with production-safe config
- Reduce the frontend initial bundle warning

## Recently Completed Milestones

- **Subscription plan refinement** (Mar 14, 2026): pricing corrected (₱599/₱1,499/₱2,999), 30-day Negosyo trial, annual billing, utang ungated to Tindahan, suppliers gated to Negosyo+. Migration: `1708000000000-UpdateSubscriptionPlans.ts` — **run `npm run migration:run` before deploying**
- **Production deployment live** (Mar 13, 2026): Railway (backend) + Vercel (frontend) + CD via native GitHub integrations + branch protection on main + PayMongo test keys wired
- Added production hardening for frontend environment replacement, auth token log removal, and raw-body webhook verification
- Confirmed DB-backed sales integration coverage for void reversal and FIFO rollback paths
- Added repository memory system to centralize operational project state

## Known Docs To Reconcile Over Time

- `docs/roadmap.md` still speaks about testing gaps that are narrower than current repo truth
- `docs/testing-phase-10.md` is still phrased as a source of truth for tests and should be treated as scoped handoff documentation
- `docs/` remains the polished reference layer; operational status should start here first
