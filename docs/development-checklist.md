# Development Checklist

Track your progress as you implement the POS system.

## Phase 1: Backend Foundation ✅

- [x] Project structure setup
- [x] Database schema design (14 entities)
- [x] Initial migration file
- [x] Multi-tenant architecture (TenantGuard, store_id isolation)
- [x] Authentication module (Supabase + JWT)
- [x] Guards and decorators (Auth, Tenant, Roles)
- [x] Configuration modules (DB, Supabase, env)
- [x] Stores module (CRUD + user-store access)

## Phase 2: Categories & Products ✅

### Categories ✅
- [x] categories.module.ts
- [x] categories.service.ts (CRUD with store_id filtering)
- [x] categories.controller.ts (TenantGuard + RolesGuard)
- [x] DTOs (create-category, update-category)
- [x] Hierarchical category support (parent_id)

### Products ✅
- [x] Migration: Added `retail_price`, `cost_price`, `current_stock` to Product entity
- [x] products.module.ts
- [x] products.service.ts (CRUD + search by name/SKU/barcode)
- [x] products.controller.ts (TenantGuard + RolesGuard)
- [x] DTOs (create-product, update-product)
- [x] Search endpoint (`GET /api/products/search?q=`)
- [x] Category filter (`GET /api/products?category_id=`)
- [x] Soft delete (sets `is_active = false`)

## Phase 3: Inventory Management ✅

- [x] inventory.module.ts
- [x] inventory.service.ts (stock in/out with FIFO batch tracking)
- [x] inventory.controller.ts (TenantGuard + RolesGuard)
- [x] DTOs (stock-adjustment with AdjustmentType enum)
- [x] Stock in: creates InventoryBatch + StockMovement, updates product.current_stock
- [x] Stock out: FIFO batch deduction, validates sufficient stock
- [x] Low stock endpoint (`GET /api/inventory/low-stock`)
- [x] Movement history endpoint (`GET /api/inventory/movements`)

## Phase 4: Sales / POS ✅

- [x] sales.module.ts
- [x] sales.service.ts (atomic transactions via DataSource.transaction())
- [x] sales.controller.ts (TenantGuard + RolesGuard)
- [x] DTOs (create-sale with nested SaleItemDto array)
- [x] Sale number generation (`SALE-YYYYMMDD-NNNN`)
- [x] VAT calculation from store.settings (12% default)
- [x] Discount support (percentage or fixed amount)
- [x] FIFO batch deduction per sale item
- [x] Stock movement recording (type: sale)
- [x] Daily sales endpoint (`GET /api/sales/daily?date=`)
- [x] Void sale with stock restoration (`POST /api/sales/:id/void`, Admin only)
- [x] SaleItem.batch_id made nullable (for products without batches)

## Phase 5: Receipts ✅

- [x] receipts.module.ts
- [x] receipts.service.ts (receipt data + PDF generation with pdfkit)
- [x] receipts.controller.ts (TenantGuard + RolesGuard)
- [x] Receipt data endpoint (`GET /api/receipts/:saleId`)
- [x] PDF receipt endpoint (`GET /api/receipts/:saleId/pdf`)
- [x] Thermal-printer-friendly receipt layout (80mm width, PDF/browser print path)
- [x] Includes: store info, TIN, items, totals, cashier, payment info
- [x] Custom receipt header/footer from store.settings

## Phase 6: Reports ✅

- [x] reports.module.ts
- [x] reports.service.ts (sales, inventory, best-selling, profit)
- [x] reports.controller.ts (Admin only)
- [x] Sales summary (`GET /api/reports/sales?period=daily|weekly|monthly`)
- [x] Inventory report (`GET /api/reports/inventory`)
- [x] Best-selling products (`GET /api/reports/best-selling?period=&limit=`)
- [x] Profit report (`GET /api/reports/profit?period=`)

## Phase 7: Users Management ✅

- [x] users.module.ts
- [x] users.service.ts (Supabase account creation + store assignment)
- [x] users.controller.ts (Admin only)
- [x] DTOs (create-user, update-user-role)
- [x] List users by store (`GET /api/users`)
- [x] Create user with Supabase account (`POST /api/users`)
- [x] Update role (`PATCH /api/users/:id/role`)
- [x] Deactivate user (`DELETE /api/users/:id`)

## Phase 8: Settings ✅

- [x] Settings endpoint on Stores controller (`PATCH /api/stores/:id/settings`)
- [x] updateSettings() merges into store.settings JSONB
- [x] Settings schema: `receipt_header`, `receipt_footer`, `tax_enabled`, `tax_rate`

## Build Verification ✅

- [x] All 7 new modules registered in app.module.ts
- [x] `npm run build` compiles with zero errors

---

## Phase 9: Frontend (Angular 21 + PrimeNG) ✅

### Project Setup ✅
- [x] Initialize Angular 21 project with standalone components
- [x] Install PrimeNG + PrimeIcons + Chart.js
- [x] Proxy config for backend API (`proxy.conf.json`)

### Core Layer ✅
- [x] Auth service (login, register, token management)
- [x] Store context service (active store, store switching)
- [x] Toast service (notifications)
- [x] Auth interceptor (JWT `Authorization` header)
- [x] Tenant interceptor (`X-Store-Id` header)
- [x] Error interceptor (global error handling)
- [x] Auth guard (route protection)
- [x] Role guard (admin-only routes)

### Models ✅
- [x] User, Store, Category, Product, Inventory, Sale, Receipt, Report models
- [x] Enums (UserRole, PaymentMethod, etc.)

### Layout ✅
- [x] Main layout component (sidebar + header + content area)
- [x] Header component (store switcher, user menu)
- [x] Sidebar component (navigation)

### Routing ✅
- [x] Lazy-loaded routes for all feature pages
- [x] Auth guard on protected routes
- [x] Admin guard on reports, users, categories, settings

### Feature Pages ✅
- [x] Login page
- [x] Register page
- [x] Dashboard (sales summary, low stock alerts)
- [x] POS screen (product search, category tabs, product grid, cart, payment dialog, receipt preview)
- [x] Products list (add/edit/deactivate)
- [x] Categories list (add/edit with hierarchy)
- [x] Inventory overview (stock in/out)
- [x] Movement history
- [x] Low stock alerts
- [x] Sales list
- [x] Sale detail (with receipt view)
- [x] Reports page (sales, inventory, best-selling, profit)
- [x] Users management (Admin)
- [x] Store settings (Admin - tax, receipt config)

### POS Components ✅
- [x] Product search component
- [x] Category tabs component
- [x] Product grid component
- [x] Cart item component
- [x] Cart panel component
- [x] Payment dialog component
- [x] Receipt preview component
- [x] Cart service (state management)

---

---

## Subscription System (Backend) ✅

- [x] Database entities: Organization, SubscriptionPlan, Subscription, Invoice, Payment, BillingPaymentMethod
- [x] Migration: Creates subscription tables, seeds 3 plans (Tindahan ₱799, Negosyo ₱1499, Kadena ₱2999)
- [x] SubscriptionGuard (validates active subscription, backward compatible with legacy stores)
- [x] FeatureGateGuard + `@RequireFeature` decorator
- [x] UsageLimitGuard + `@CheckLimit` decorator
- [x] Guards applied to all controllers
- [x] Auth flow: register creates org + trial, login returns subscription info
- [x] Subscription Plans module (`GET /api/subscription-plans` — public)
- [x] Billing module (subscription CRUD, upgrade/downgrade/cancel with usage validation)
- [x] Payments module (PaymentGateway interface, MockPaymentService, PaymongoService)
- [x] Cron jobs: renewal processing, failed payment retry, trial ending reminders

## Subscription System (Frontend) ✅

- [x] SubscriptionService with Angular signals + localStorage persistence
- [x] Subscription models (SubscriptionInfo, SubscriptionPlan, SubscriptionFeature enum)
- [x] Auth integration: subscription data returned on login/register, persisted to localStorage
- [x] Adaptive sidebar: nav items filtered by `requiresFeature` property
- [x] Adaptive dashboard: skips blocked API calls, shows upgrade prompts
- [x] Customer feature gating: credit statement/payment buttons hidden on Tindahan
- [x] Error interceptor: 402/403 feature gate errors show "Feature Locked" toast
- [x] Billing page (`/billing`, admin-only): subscription status, usage progress bars, plan comparison grid
- [x] Upgrade dialog: plan review + "NEW" feature badges + payment bypass toggle
- [x] Downgrade and cancel flows with confirmation dialogs

## Phase 10: Testing & Deployment ⏳

### Backend Testing ✅
- [x] Unit tests for backend services (tenant.guard, sales.service)
- [x] E2E tests — registration to first sale happy path
- [x] Integration tests scaffold (DB-backed SalesService with real TypeORM)
- [x] Fresh-DB migration parity fix for `customers.is_active` used by app code and E2E seeds
- [x] Integration tests: voidSale stock restoration + credit balance reversal
- [x] Integration tests: FIFO rollback / insufficient-batch coverage

### Frontend Testing — Infrastructure ✅
- [x] Install `vitest` + `@vitest/coverage-v8`
- [x] `tsconfig.spec.json` — `"types": ["vitest/globals"]`
- [x] `angular.json` — `test` architect target (`@angular/build:unit-test` + vitest runner)

### Frontend Testing — Core Layer ✅ (120 tests, all green)
- [x] `php-currency.pipe.spec.ts` — null/NaN/number/string edge cases (9 tests)
- [x] `cart.service.spec.ts` — add/remove/quantity/hold/recall/clear/computed signals (34 tests)
- [x] `auth.guard.spec.ts` — authenticated/unauthenticated redirect (2 tests)
- [x] `role.guard.spec.ts` — ADMIN pass-through / CASHIER redirect (2 tests)
- [x] `auth.interceptor.spec.ts` — token present/absent header injection (3 tests)
- [x] `tenant.interceptor.spec.ts` — storeId present/absent/skip-paths (4 tests)
- [x] `error.interceptor.spec.ts` — 401/402/403/404/0/default toast cases (12 tests)
- [x] `subscription.service.spec.ts` — signals, localStorage, hasFeature, HTTP calls (23 tests)
- [x] `store-context.service.spec.ts` — initializeStore, switchStore, isAdmin (15 tests)
- [x] `auth.service.spec.ts` — login/register/logout localStorage + subscription integration (16 tests)

### Frontend Testing — Feature Layer ✅
- [x] `dashboard.spec.ts` — skips locked reports APIs and still loads always-available dashboard data
- [x] `pos.spec.ts` — posts partial-sale payload with customer and discount context
- [x] `customer-list.spec.ts` — payment submission reloads customer list
- [x] `product-list.spec.ts` — init loading + create flow refresh coverage

### Frontend E2E — Playwright ⏳
- [x] Playwright installed and configured with frontend + backend web servers
- [x] Dedicated GitHub Actions workflow for isolated Supabase E2E runs
- [x] CI-safe reset → migrate → seed → test pipeline for `pos-and-inventory-e2e`
- [x] E2E database guard validates the Supabase project ref and accepts both direct DB and pooler connection strings
- [x] Playwright E2E runs on protected-branch pushes/manual dispatch, not on `pull_request`, because the isolated Supabase reset requires secrets
- [x] Billing and permissions suite:
  - [x] Tindahan blocked-feature UI
  - [x] Upgrade flow to Negosyo
  - [x] Admin vs cashier access
- [x] Smoke coverage added for:
  - [x] Login
  - [x] Create product
  - [x] Stock in
  - [x] Complete cash sale
  - [x] Complete credit / partial sale
  - [x] Void sale
  - [x] Switch store / verify isolation
- [x] Resolve backend `sales.sale_number` global uniqueness collision found by parallel Playwright sales flows

### Deployment
- [ ] Backend deployment (Railway)
- [ ] Frontend deployment (Vercel)
- [ ] Run migrations on production DB
- [ ] Production environment variables
- [x] CI pipeline (GitHub Actions — backend/frontend build + test on push/PR)
- [ ] CD pipeline (deploy automation)

### Production Hardening (Mar 2, 2026)
- [x] Startup env validation (required vars + production payment safety checks)
- [x] Expanded backend `.env.example` for billing/payment keys
- [x] Platform admin foundation (`users.is_platform_admin` + JWT payload propagation)
- [x] Platform billing admin APIs (`/api/admin/subscriptions`, `/api/admin/invoices`, `/api/admin/payments`)
- [x] Platform billing admin page (`/platform/subscriptions`)
- [x] Payment-intent upgrade flow (`POST /api/payments/intents` + `payment_id` verification in `POST /api/billing/upgrade`)
- [x] Webhook event idempotency guard (dedupe via processed event IDs)
- [x] Frontend production environment replacement wired (`environment.prod.ts` now used in production builds)
- [x] Removed auth token logging from frontend HTTP interceptor
- [x] PayMongo webhook verification now uses raw request body with Nest `rawBody` support

---

## Supplier Management ✅ (Feb 25, 2026)

- [x] Migration: `1707600000000-AddSupplierIsActive.ts` adds `is_active` to suppliers
- [x] `suppliers.module.ts`, `suppliers.service.ts`, `suppliers.controller.ts`
- [x] DTOs: `create-supplier.dto.ts`, `update-supplier.dto.ts`
- [x] Permissions: `SUPPLIERS_VIEW`, `SUPPLIERS_MANAGE` (admin-only)
- [x] Inventory integration: stock-in dialog accepts optional `supplier_id`
- [x] Movements include `batch.supplier` relation + optional `movement_type` filter
- [x] Frontend: `features/suppliers/` (supplier-list, supplier-table, supplier-form-dialog)
- [x] Route `/suppliers`, sidebar between Customers and Reports

---

## Phase 11: Future Enhancements ⏳

- [x] Customer management (credit/utang system) — ✅ completed in Phase 9
- [x] Credit payments tracking — ✅ completed in Phase 9
- [x] Supplier management
- [ ] Barcode scanning integration
- [ ] Offline mode / PWA support
- [ ] Low stock alert cron jobs
- [ ] Expiry date warnings
- [ ] Data export (CSV/Excel)
- [ ] Multi-device sync
- [ ] BIR compliance reports
- [ ] Email notifications (trial ending, payment receipts, renewal confirmations)
- [ ] PayMongo live integration (set PAYMONGO_SECRET_KEY + set bypassPayment: false)

---

**Current Status**: Core backend/frontend, subscription system, supplier management, Playwright smoke/billing coverage, feature-level frontend component tests, and backend sales integration coverage are complete ✅ | Thermal printer hardware integration, low-stock automation, deployment, and broader launch hardening are pending ⏳
