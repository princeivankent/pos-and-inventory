# Recent Changes

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
