# Recent Changes

## 2026-03-14

- `fix/downgrade-pending-state`
  - `GET /billing/subscription` now returns `pending_downgrade { plan_code, plan_name, effective_date }` when a downgrade is scheduled at period end
  - Added `POST /billing/cancel-downgrade` endpoint to remove a pending downgrade
  - Frontend billing page shows a warning banner when a downgrade is pending (target plan + effective date + Cancel Downgrade button)
  - Plan card for the scheduled plan shows a disabled "Scheduled" button instead of "Downgrade"
  - Fixed incorrect toast message for active-sub downgrades ("Downgrade scheduled" instead of "You are now on X plan")
  - Branch: `fix/downgrade-pending-state`

## 2026-03-13

- `production-deployment`
  - Backend live on Railway: https://pos-and-inventory-production.up.railway.app
  - Frontend live on Vercel: https://pos-and-inventory-seven.vercel.app
  - CD wired via native GitHub integrations on both platforms (auto-deploy on main)
  - Migrations run automatically at startup via start.sh
  - GitHub branch protection on main requires CI to pass before merge
  - PayMongo test mode keys configured in Railway
  - Added: backend/railway.json, backend/start.sh, frontend/vercel.json

## 2026-03-07

- `memory-system`
  - Added a file-driven project memory system under `memory/`
  - Seeded feature memory from current verified repo state
  - Updated repository workflow instructions so future work keeps memory current
  - Added dedicated receipt/thermal-printing memory coverage to separate browser/PDF support from unfinished hardware rollout

- `production-hardening`
  - Wired Angular production builds to use `environment.prod.ts`
  - Removed frontend auth token console logging
  - Switched PayMongo webhook verification to use Nest raw request bodies
  - Added regression coverage for raw-body webhook verification

- `repo-state-reconciliation`
  - Corrected stale docs that claimed sales integration gaps still existed
  - Confirmed DB-backed coverage for void-sale restoration, balance clamping, and FIFO rollback
