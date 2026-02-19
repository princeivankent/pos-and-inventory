# Multi-Tenant POS & Inventory Management System

A comprehensive Point of Sale and Inventory Management System designed for small retail stores in the Philippines with multi-tenant support, FIFO inventory tracking, customer credit management (utang), and BIR compliance.

## Project Status

- ✅ **Phases 1-8**: Backend complete (NestJS + TypeORM + PostgreSQL)
- ✅ **Phase 9**: Frontend complete (Angular 21 + PrimeNG)
- ✅ **UI/UX Modernization**: Login, Reports, Products, Customers pages
- ✅ **Subscription System**: 3-tier billing (Tindahan/Negosyo/Kadena), PayMongo integration, feature gates, usage limits
- ✅ **Billing Pages**: Admin billing dashboard, usage monitoring, plan upgrade/downgrade UI
- 🚧 **Phase 10**: Testing & Deployment (in progress)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS, TypeORM, PostgreSQL (Supabase) |
| **Frontend** | Angular 21, PrimeNG, Angular Signals |
| **Auth** | Supabase Auth + JWT (7d expiry) |
| **Database** | 20 entities (14 core + 6 subscription) with multi-tenant isolation via `store_id` |
| **Billing** | 3-tier subscription system with PayMongo integration |

## Features

### POS & Sales
- 6 payment methods: Cash, GCash, Maya, Card, Credit (utang), Partial (cash + credit split)
- Product grid with category filtering and barcode/SKU search
- Cart with quantity management, discounts (fixed/percentage), hold/recall
- 12% VAT calculation (configurable per store)
- Receipt preview (BIR compliant)

### Customer Credit (Utang)
- Per-customer credit limits with real-time balance tracking
- Credit and partial payment sales directly from POS
- Credit limit validation before allowing credit sales
- Payment recording (cash, gcash, maya, card) against outstanding balance
- Credit statements with unified transaction history and running balance
- Automatic balance reversal on voided credit sales

### Inventory
- FIFO batch tracking with automatic oldest-first selection
- Stock movements audit trail (purchase, sale, adjustment, return, expired, damaged)
- Low stock alerts with reorder levels
- Expiry date tracking for perishable goods

### Multi-Tenancy
- Row-level isolation via `store_id` on all tenant tables
- Multi-store access per user with role-based permissions (Admin/Cashier)
- Granular permissions: PRODUCTS_VIEW, SALES_CREATE, CUSTOMERS_MANAGE, etc.
- Store switching without re-authentication

### Management Pages
- **Products**: Table/card views, search autocomplete, category filters, CRUD
- **Categories**: Hierarchical categories with parent/child
- **Inventory**: Batch overview, stock movements, low stock alerts
- **Sales**: Daily sales, sale details, void capability
- **Customers**: Customer list, credit statements, payment dialogs
- **Reports**: Sales charts, best-selling products, inventory stats
- **Users**: Role assignment, permission management
- **Settings**: Store configuration (tax, receipts)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (via Supabase)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # Configure your environment variables
npm run migration:run   # Apply database migrations
npm run start:dev       # Start on port 3000
```

**Required `.env` variables:**
```env
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=7d
FRONTEND_URL=http://localhost:4200
```

### Frontend Setup

```bash
cd frontend
npm install
npm run start           # Start on port 4200
```

Configure API URL in `frontend/src/environments/environment.ts`.

## API Endpoints

All endpoints (except auth) require `Authorization: Bearer <token>` and `X-Store-Id: <uuid>` headers.

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/switch-store` |
| **Products** | `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/:id` |
| **Categories** | `GET/POST /api/categories`, `GET/PATCH/DELETE /api/categories/:id` |
| **Inventory** | `GET/POST /api/inventory/batches`, `GET /api/inventory/movements`, `POST /api/inventory/adjust` |
| **Sales** | `POST /api/sales`, `GET /api/sales/daily`, `GET /api/sales/:id`, `POST /api/sales/:id/void` |
| **Customers** | `GET/POST /api/customers`, `GET/PATCH/DELETE /api/customers/:id`, `GET /api/customers/:id/statement`, `POST /api/customers/:id/payments` |
| **Reports** | `GET /api/reports/sales`, `GET /api/reports/inventory`, `GET /api/reports/best-selling` |
| **Users** | `GET/POST /api/users`, `PATCH/DELETE /api/users/:id` |
| **Stores** | `GET/PATCH /api/stores/:id` |
| **Subscription Plans** | `GET /api/subscription-plans` (public) |
| **Billing** | `GET /api/billing/subscription`, `GET /api/billing/usage`, `POST /api/billing/upgrade`, `POST /api/billing/downgrade`, `POST /api/billing/cancel` |
| **Payments** | `POST /api/payments/create-intent`, `POST /api/payments/webhook` |

## Project Structure

```
pos-and-inventory/
├── backend/src/
│   ├── auth/               # Supabase + JWT authentication
│   ├── common/             # Guards, decorators, interceptors, permissions
│   ├── config/             # Environment, database, Supabase config
│   ├── database/           # 20 entities + migrations
│   ├── stores/             # Store CRUD + settings
│   ├── categories/         # Hierarchical categories
│   ├── products/           # Products + pricing
│   ├── inventory/          # FIFO batches + stock movements
│   ├── sales/              # Atomic transactions + credit
│   ├── customers/          # Credit management + payments
│   ├── receipts/           # Receipt generation
│   ├── reports/            # Sales/inventory reports
│   ├── users/              # User + permission management
│   ├── subscription-plans/ # Public plan catalog
│   ├── billing/            # Subscription management + cron jobs
│   └── payments/           # PayMongo integration (mock + real)
├── frontend/src/app/
│   ├── core/           # Services, guards, interceptors, models
│   ├── shared/         # Shared components, pipes
│   ├── layout/         # Sidebar, layout shell
│   └── features/       # auth, pos, products, categories, inventory,
│                       # sales, customers, reports, users, settings, dashboard, billing
├── docs/               # Project documentation
└── CLAUDE.md           # AI development context
```

## Documentation

- **CLAUDE.md** - Development patterns and AI context
- **QUICKSTART.md** - Quick setup guide
- **docs/architecture.md** - System architecture and flow diagrams
- **docs/project-summary.md** - Comprehensive feature specifications
- **docs/subscription-status.md** - Subscription system implementation details
- **docs/subscription-testing.md** - Testing guide for subscription features
- **docs/development-checklist.md** - Phase-by-phase implementation checklist
- **docs/roadmap.md** - Product roadmap and future plans

## License

Proprietary - All rights reserved
