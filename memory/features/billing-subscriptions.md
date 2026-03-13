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
- Payment-intent upgrade flow
- Webhook idempotency protection
- Raw-body webhook verification
- Production guardrails that block `BYPASS_PAYMENT=true` in backend production mode
- Frontend production builds now correctly use `bypassPayment: false`
- **Pending downgrade state surfaced in UI** (Mar 14, 2026):
  - `GET /billing/subscription` now includes `pending_downgrade { plan_code, plan_name, effective_date }` when a downgrade is scheduled
  - `POST /billing/cancel-downgrade` removes the pending downgrade
  - Frontend billing page shows a warning banner with the target plan, effective date, and "Cancel Downgrade" button
  - Plan card for the scheduled plan shows a disabled "Scheduled" button instead of "Downgrade"
  - Downgrade toast now correctly says "Downgrade scheduled" for active subs (not "You are now on X plan")

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

## Last Updated

- 2026-03-14
