# Low-Stock Alerts

Last updated: 2026-03-15

## Purpose

Automatically detect low-stock and out-of-stock products for Kadena stores and notify store admins via email once per low-stock event.

## Current Status

- Status: `done`
- Confidence: `verified` (tested end-to-end Mar 15, 2026 — email received, DB state confirmed)

## What Exists

### Backend (`backend/src/alerts/`, `backend/src/email/`)

- **`AlertsService`** — daily cron (`0 9 * * *`) calls `runDailyCheck()`
  - `getKadenaStoreIds()` — finds stores on plans with `low_stock_alerts: true` feature (Kadena tier)
  - `checkStoreStock(storeId)` — per-store logic:
    - Finds products where `current_stock <= reorder_level`
    - Auto-resolves alerts for products back above reorder level
    - Creates new `LowStockAlert` records only for products without an existing unresolved alert
    - Calls `sendAlertsEmail()` for new alerts
  - `sendAlertsEmail()` — sends via `EmailService` (Resend) to store email + all admin user emails; marks alerts `email_sent = true`
- **`LowStockAlert` entity** — `store_id`, `product_id`, `alert_type` (LOW_STOCK / OUT_OF_STOCK), `alert_date`, `is_resolved`, `resolved_at`, `email_sent`, `email_sent_at`
- **`EmailService`** — `sendLowStockAlertEmail(to, storeName, products[])` renders HTML email via Resend
- **Migration**: `1710000000000-AddLowStockAlertEmailFields.ts` — adds `email_sent` + `email_sent_at` columns

### Feature Gating

- Gated to Kadena plan via `low_stock_alerts: true` in `subscription_plans.features` JSONB
- `getKadenaStoreIds()` queries the plan features column directly — no hardcoded plan name

## Key Behaviors

- **One email per event**: email is sent only once when the alert is first created; subsequent cron runs skip products with existing unresolved alerts
- **Auto-resolve**: when `current_stock > reorder_level` on next cron run, alert is marked `is_resolved = true`
- **Edge case**: `current_stock = reorder_level` is still considered low stock (`<=` condition) — stock must exceed reorder level to resolve
- **Recipients**: union of `store.email` + all admin `user_stores` emails for that store
- **Alert types**: `OUT_OF_STOCK` when `current_stock = 0`, `LOW_STOCK` otherwise

## Environment Variables

- `RESEND_API_KEY` — required in `backend/.env`; without it email sending will fail silently (caught per-recipient in try/catch)

## Testing Notes

- To test without waiting for 9am: temporarily change `@Cron('0 9 * * *')` → `@Cron('* * * * *')` in `alerts.service.ts`, revert after
- To trigger a new email after testing: `DELETE FROM low_stock_alerts WHERE store_id = '<id>';`
- Store must be on Kadena plan (or active trial with `low_stock_alerts` in plan features)

## File Locations

- `backend/src/alerts/alerts.module.ts`
- `backend/src/alerts/alerts.service.ts`
- `backend/src/email/email.module.ts`
- `backend/src/email/email.service.ts`
- `backend/src/database/entities/low-stock-alert.entity.ts`
- `backend/src/database/migrations/1710000000000-AddLowStockAlertEmailFields.ts`
