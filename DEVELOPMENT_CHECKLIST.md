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
- [x] Thermal-printer-friendly format (80mm width)
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

## Phase 10: Testing & Deployment ⏳

### Testing
- [ ] Unit tests for backend services
- [ ] Integration tests (multi-tenant isolation, sale transactions)
- [ ] E2E tests (registration to first sale)
- [ ] Frontend component tests

### Deployment
- [ ] Backend deployment (Railway or similar)
- [ ] Frontend deployment (Vercel or Firebase Hosting)
- [ ] Run migrations on production DB
- [ ] Production environment variables
- [ ] CI/CD pipeline setup

---

## Phase 11: Future Enhancements ⏳

- [ ] Customer management (credit/utang system)
- [ ] Credit payments tracking
- [ ] Supplier management
- [ ] Barcode scanning integration
- [ ] Offline mode / PWA support
- [ ] Low stock alert cron jobs
- [ ] Expiry date warnings
- [ ] Data export (CSV/Excel)
- [ ] Multi-device sync
- [ ] BIR compliance reports

---

**Current Status**: Backend Complete ✅ | Frontend Complete ✅ | Testing & Deployment Pending ⏳
