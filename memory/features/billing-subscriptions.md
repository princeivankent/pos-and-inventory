# Billing & Subscriptions

Last updated: 2026-03-07

## Purpose

Control subscription state, plan features, usage limits, billing workflows, payment integration, and platform billing administration.

## Current Status

- Status: `done`

## What Exists

- Organization, subscription, invoice, payment, and plan data model
- Subscription, feature-gate, and usage-limit guards
- Billing management APIs for upgrade, downgrade, cancel, usage, and cancel-downgrade
- Frontend billing page and platform subscription admin page
- Payment-intent upgrade flow with `billing_period` (monthly / annual)
- Webhook idempotency protection + raw-body webhook verification
- Production guardrails that block `BYPASS_PAYMENT=true` in backend production mode
- Frontend production builds use `bypassPayment: false`
- **Pending downgrade state surfaced in UI** (Mar 14, 2026)
- **Subscription plan refinement** (Mar 14, 2026) — see recent-changes.md

## Plan Design (as of Mar 14, 2026)

| Plan | Monthly | Annual | Stores | Users/store | Products | Key features |
|------|---------|--------|--------|-------------|----------|--------------|
| Tindahan | ₱599 | ₱5,990 | 1 | 3 | 300 | POS, inventory, FIFO, utang |
| Negosyo | ₱1,499 | ₱14,990 | 3 | 10 | 1,000 | + reports, suppliers, multi-store, export, receipt customization |
| Kadena | ₱2,999 | ₱29,990 | 10 | 25 | 99,999 | + export_advanced, low_stock_alerts |

**Trial**: 30 days on Negosyo plan. Expiry → account suspended (data preserved). Run `npm run migration:run` to apply plan changes.

## Feature Gate Reference

| Feature key | Min tier | Controller/Guard |
|-------------|----------|-----------------|
| `reports` | Negosyo | `reports.controller.ts` class-level |
| `supplier_management` | Negosyo | `suppliers.controller.ts` class-level |
| `utang_management` | Tindahan (all) | **No gate** — removed Mar 14, 2026 |
| `receipt_customization` | Negosyo | frontend only (no backend endpoint gate) |
| `multi_store` | Negosyo | checked in `UsageLimitGuard` for stores |
| `export_advanced` | Kadena | not yet wired to endpoint — future |
| `low_stock_alerts` | Kadena | not yet wired to endpoint — future |

## Known Gaps

- Live PayMongo rollout still needs final end-to-end validation with real credentials
- Billing notifications are not yet implemented

## Recent Decisions

- Frontend and backend bypass-payment behavior must stay aligned through environment configuration
- Webhook signature verification must use raw request bodies
- Downgrade is always scheduled at period end for active subscriptions (standard SaaS pattern); trial downgrades apply immediately

## Dependencies / Cross-Cutting Notes

- Affects feature visibility across customers, reports, inventory, and products
- Production readiness depends on real deployment and live secret configuration

## Next Actions

- Configure live payment credentials and validate full production-safe billing flow

## Validation / Evidence

- `backend/src/billing`
- `backend/src/payments`
- `frontend/src/app/features/billing`
- `frontend/tests/e2e/billing-permissions.spec.ts`
- Backend and frontend billing-related tests are passing

## Annual Billing Flow

- Frontend `billing.ts`: `isAnnual` toggle → `getDisplayPrice(plan)` = `price_php × 10` if annual
- `POST /payments/intents` → passes `billing_period`; service charges `price_php × 10` for annual, creates invoice with override amount
- `POST /billing/upgrade` → passes `billing_period`; service sets `current_period_end` to +365 days for annual
- `billing_period` stored on `subscriptions` table — renewal cron respects it when extending period
- `localStorage('pos_pending_upgrade_billing_period')` persists across PayMongo redirect tabs

## Last Updated

- 2026-03-14
