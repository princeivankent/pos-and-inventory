# Recent Changes

## 2026-03-15 (low-stock-alerts)

- **Low-stock alert cron** (`backend/src/alerts/alerts.service.ts`) — daily `@Cron('0 9 * * *')` checks all stores on Kadena plan (or any plan with `low_stock_alerts: true`); creates `LowStockAlert` records for products where `current_stock <= reorder_level`; skips products with existing unresolved alerts (one email per event)
- **Email sending** (`backend/src/email/email.service.ts`) — `sendLowStockAlertEmail()` via Resend sends to store email + all admin users; marks alerts `email_sent = true` after sending
- **Auto-resolve** — on each cron run, alerts for products back above reorder level are auto-resolved (`is_resolved = true`); note: `current_stock = reorder_level` is still low (condition is `<=`)
- **Migration**: `1710000000000-AddLowStockAlertEmailFields.ts` — adds `email_sent` + `email_sent_at` to `low_stock_alerts`
- **Feature gate**: Kadena-only via `low_stock_alerts` JSONB feature flag on `subscription_plans`
- Verified end-to-end: email received, DB state confirmed, auto-resolve behavior confirmed

## 2026-03-15 (subscription-gating-audit)

- **`getMinimumPlanForFeature` bug fixed** (`subscription.service.ts`) — `export_data` now correctly returns `'negosyo'` (was wrongly returning `'kadena'`); Kadena-only features (`export_advanced`, `low_stock_alerts`) now correctly return `'kadena'`
- **Receipt customization gated in Settings** (`store-settings.ts/html`) — added `hasReceiptCustomization` signal; Receipt Header/Footer fields hidden for Tindahan users; compact upgrade prompt shown in their place; Save Settings button (for tax config) remains always visible
- **Reports page upgrade prompt** (`reports.ts/html`) — added `hasReports` signal + `ngOnInit` short-circuit (skips all 4 API calls if feature absent); direct navigation to `/reports` by Tindahan users now shows a full-page upgrade prompt instead of blank/broken page; also added `.upgrade-prompt` styles to `reports.scss`
- **Suppliers page upgrade prompt** (`supplier-list.ts/html/scss`) — injected `SubscriptionService`, added `hasSupplierMgmt` signal + `ngOnInit` guard; direct navigation to `/suppliers` by Tindahan users shows clean upgrade prompt; "Add Supplier" header button also hidden when locked; `RouterLink` added to imports; `.upgrade-prompt` styles added to `supplier-list.scss`

## 2026-03-15 (docs-only)

- **Roadmap** (`docs/roadmap.md`) — added Phase 2.3 Email Notifications section tracking 7 lifecycle email events (trial warnings, payment failure, renewal confirmation, low-stock); infrastructure note explains EmailJS is browser-only and a backend email service (Resend/SendGrid/Nodemailer) is required before any cron event can send email; each event is a standalone checkbox item; build order table updated (items 5-7 renumbered)
- **Billing memory** (`memory/features/billing-subscriptions.md`) — confirmed Tindahan price is ₱599/mo (corrected from ₱799 during Mar 14 migration `1708000000000-UpdateSubscriptionPlans.ts`); updated Last Updated date to 2026-03-15

## 2026-03-14 (ui-ux-improvements — PR #34)

- **Billing page** (`billing.html/ts/scss`) — layout and style refinements
- **Header** (`header.html/ts/scss`) — visual/UX polish after profile link addition
- **Sidebar** (`sidebar.ts`) — navigation adjustments

## 2026-03-14 (ui-ux-improvements-broad — PR #32)

- **UI/UX pass across nearly all pages** — login, register, dashboard, products, reports, sidebar, header, billing, categories, customers, inventory, platform, POS cart, sales, settings, suppliers, users, page-header
- **Backend dashboard fix** (`reports.service.ts`) — corrected dashboard report data/values (totals were returning wrong figures)
- Global styles updated: `_layout.scss`, `_overrides.scss`, `_variables.scss`
- Auth pages (login, register) received additional polish on top of the earlier modernization

## 2026-03-14 (csv-export — PR #31)

- **CSV export service** — new `core/services/csv-export.service.ts` with dot-notation field resolution and proper CSV quoting; unit tests in `csv-export.service.spec.ts`
- **Export buttons added** to Reports, Sales, Products, and Inventory (overview + stock movements) pages
- Export is **feature-gated** to `export_data` flag (Negosyo+ plans) using `hasFeatureSignal('export_data')`
- 38+ unit tests added across affected components

## 2026-03-15 (user-profile-forgot-password)

- **Forgot password flow** — `POST /auth/forgot-password` generates UUID token (1-hr expiry) stored on `users` table, returns reset link; frontend sends email via EmailJS (`@emailjs/browser`)
- **Reset password page** (`/reset-password?token=xxx`) — validates token server-side, updates Supabase password via admin API, clears token after use
- **Profile page** (`/profile`) — two-card layout: Personal Info (avatar initials, full_name edit, read-only email) + Change Password (current + new + confirm with Supabase verification)
- **Header** — user name now a `[routerLink]="/profile"` clickable link
- **Login page** — "Forgot password?" link activated (was "Coming Soon" disabled span)
- **Migration**: `1709000000000-AddPasswordResetToken.ts` — adds `password_reset_token` and `password_reset_expires_at` to `users`
- **EmailJS**: `service_u7kzvmf` / `template_k1oj5b1` configured in both environment files; template vars: `{{to_name}}`, `{{to_email}}`, `{{reset_link}}`
- `AuthService` (frontend) — 4 new methods: `forgotPassword`, `resetPassword`, `updateProfile`, `changePassword`
- `AuthService` (backend) — 4 new methods + `NotFoundException` import + 4 new DTOs

## 2026-03-14 (subscription-plan-refinement)

- Refined subscription plans: pricing, feature allocation, trial strategy, annual billing, supplier gating
  - **Pricing fixed**: ₱599 / ₱1,499 / ₱2,999 (was inconsistent between CLAUDE.md and migration)
  - **Trial**: 30 days on Negosyo plan (was 14 days on Tindahan) — show full value before asking to pay
  - **Trial expiry**: suspends account (data preserved); reminder crons now fire at 10 days + 3 days remaining
  - **Tindahan** now includes `fifo_inventory` + `utang_management` (moved from Negosyo); product limit raised 100→300
  - **Negosyo** product limit raised 500→1,000; `supplier_management` feature added and gated here
  - **Kadena** price lowered 3,999→2,999; product limit raised 2,000→99,999; new features: `export_advanced`, `low_stock_alerts`
  - **Annual billing**: new `billing_period` column on `subscriptions`; annual = 10× monthly price (2 months free); period set to 365 days
  - **Suppliers gated**: `@RequireFeature('supplier_management')` added to `suppliers.controller.ts`; sidebar item hidden for Tindahan
  - **Utang ungated**: `@RequireFeature('utang_management')` removed from customers controller (now Tindahan+)
  - **PayMongo**: `createUpgradePaymentIntent` now accepts `billing_period`; invoice amount = plan.price × 10 for annual
  - Migration: `1708000000000-UpdateSubscriptionPlans.ts`
  - All SubscriptionFeature enum values updated in frontend model

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
