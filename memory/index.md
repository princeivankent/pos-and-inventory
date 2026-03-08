# Project Memory Index

Last updated: 2026-03-07

## Overall State

- Stage: pre-launch
- Operational source of truth: this `memory/` folder
- Overall status: core POS, inventory, credit, suppliers, billing, CI, and Playwright E2E are implemented
- Main remaining launch blockers: deployment/CD, thermal printer path, low-stock automation, live payment rollout, frontend bundle/perf tuning

## Launch Blockers

- Deployment path is not implemented in-repo yet
- CD automation is not implemented in-repo yet
- Thermal printing is not wired to real POS hardware flows
- Low-stock automation exists only as views/endpoints, not cron + notification flow
- PayMongo live rollout still needs live-key configuration and production validation
- Frontend production bundle is above the warning budget

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
| [Billing & Subscriptions](./features/billing-subscriptions.md) | `done` | `verified` | 2026-03-07 | Complete live-payment rollout and production validation |
| [Testing & CI](./features/testing-ci.md) | `done` | `verified` | 2026-03-07 | Add deployment smoke coverage and broader feature E2E where valuable |
| [Deployment](./features/deployment.md) | `planned` | `verified` | 2026-03-07 | Define and implement production deployment path |

## Current Top Priorities

- Finalize production deployment and CD
- Wire thermal printing for real POS environments
- Automate low-stock detection and surface it in workflow-friendly ways
- Complete live PayMongo rollout validation with production-safe config
- Reduce the frontend initial bundle warning

## Recently Completed Milestones

- Added production hardening for frontend environment replacement, auth token log removal, and raw-body webhook verification
- Confirmed DB-backed sales integration coverage for void reversal and FIFO rollback paths
- Added repository memory system to centralize operational project state
- Split receipt/PDF support from unfinished real thermal-printing work in operational memory

## Known Docs To Reconcile Over Time

- `docs/roadmap.md` still speaks about testing gaps that are narrower than current repo truth
- `docs/testing-phase-10.md` is still phrased as a source of truth for tests and should be treated as scoped handoff documentation
- `docs/` remains the polished reference layer; operational status should start here first
