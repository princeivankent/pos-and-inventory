# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-tenant POS & Inventory Management System for Philippine retail stores with FIFO inventory tracking, customer credit management (utang), and BIR compliance features.

**Current Status**:
- ✅ Phase 1-8 Complete: Backend foundation + all core modules (Categories, Products, Inventory, Sales, Receipts, Reports, Users)
- ✅ Phase 9 Complete: Frontend (Angular 21 + PrimeNG) with all pages scaffolded
- ✅ UI/UX Modernization Phase 1: Login & Reports pages enhanced with modern design
- 🚧 Phase 10 In Progress: Testing & Deployment preparation

## Technology Stack

- **Backend**: NestJS + TypeORM + PostgreSQL (Supabase)
- **Authentication**: Supabase Auth + JWT (7d expiration)
- **Frontend**: Angular 21 + PrimeNG (standalone components)
- **Database**: 14 entities with multi-tenant isolation via `store_id`
- **UI/UX**: Modern design system with gradients, animations, and responsive layouts

## Common Development Commands

### Backend Development
```bash
cd backend

# Development
npm run start:dev              # Start with hot-reload on port 3000

# Build & Production
npm run build                  # Compile TypeScript to dist/
npm run start:prod            # Run production build

# Database Migrations
npm run migration:generate    # Generate migration from entity changes
npm run migration:run         # Apply pending migrations
npm run migration:revert      # Rollback last migration

# Testing
npm run test                  # Run unit tests
npm run test:e2e             # Run end-to-end tests
npm run test:cov             # Generate coverage report

# Code Quality
npm run lint                  # Run ESLint with auto-fix
npm run format               # Format with Prettier
```

### Frontend Development
```bash
cd frontend

# Development
npm run start                 # Start dev server on port 4200 with hot-reload
npm run dev                   # Alias for npm start

# Build & Production
npm run build                 # Production build to dist/ (670 kB)
npm run build:dev            # Development build

# Testing
npm run test                  # Run unit tests with Karma
npm run test:watch           # Run tests in watch mode
npm run e2e                  # Run end-to-end tests

# Code Quality
npm run lint                  # Run ESLint
```

### Environment Setup
**Backend** - Required `.env` variables in `backend/`:
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`, `JWT_EXPIRATION` (default: 7d)
- `NODE_ENV` (development/production)
- `FRONTEND_URL` (for CORS)

**Frontend** - Configure in `frontend/src/environments/`:
- `environment.ts` - Development config (API: http://localhost:3000)
- `environment.prod.ts` - Production config
- Set `apiUrl` and `supabaseUrl` for backend integration

## Architecture Patterns

### Multi-Tenant Architecture

**Store Isolation Pattern**: Every tenant-specific table inherits from `TenantBaseEntity` which includes `store_id`. All queries must filter by store.

**Request Flow**:
1. Client sends JWT in `Authorization: Bearer <token>` header
2. Client sends store ID in `X-Store-Id: <uuid>` header
3. `AuthGuard` validates JWT and extracts `user_id`
4. `TenantGuard` validates user has access to requested store (via `user_stores` junction table)
5. `RolesGuard` validates user role (ADMIN or CASHIER) for the action
6. Service layer queries filtered by `store_id`

**Key Components**:
- `TenantBaseEntity`: Base class with `store_id` column - extend this for all tenant-specific entities
- `TenantGuard`: Validates user access to requested store, injects `storeId` and `role` into `request.user`
- `@CurrentUser()` decorator: Extracts user from request
- `@CurrentStore()` decorator: Extracts storeId from request (set by TenantGuard)
- `@Roles(UserRole.ADMIN)` decorator: Restricts endpoint to specific roles

### Module Structure Pattern

Follow the pattern established in `backend/src/stores/`:
```
module-name/
├── module-name.module.ts        # Module definition with TypeORM entities
├── module-name.service.ts       # Business logic (inject repositories)
├── module-name.controller.ts    # HTTP endpoints with guards
└── dto/
    ├── create-module.dto.ts     # Use class-validator decorators
    └── update-module.dto.ts     # Use PartialType(CreateDto)
```

**Controller Pattern**:
```typescript
@Controller('endpoint')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
export class ExampleController {
  @Get()
  findAll(@CurrentStore() storeId: string) {
    return this.service.findAllByStore(storeId);
  }

  @Post()
  @Roles(UserRole.ADMIN)  // Admin-only action
  create(@Body() dto: CreateDto, @CurrentStore() storeId: string) {
    return this.service.create(dto, storeId);
  }
}
```

### Frontend Component Pattern

**Angular 21 Standalone Components** (multi-file structure):
```typescript
// feature-name.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-feature-name',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './feature-name.html',
  styleUrls: ['./feature-name.scss']
})
export class FeatureNameComponent implements OnInit {
  // Component logic
}
```

**PrimeNG Components Used**:
- `TableModule` - Data tables with pagination, sorting, filtering
- `ButtonModule` - Buttons with icons and variants
- `InputTextModule`, `InputNumberModule` - Form inputs
- `CardModule` - Card containers for content sections
- `ChartModule` - Charts.js integration for reports
- `DialogModule` - Modal dialogs
- `ToastModule` - Notification messages
- `DropdownModule` - Select dropdowns
- `CalendarModule` - Date pickers

**Service Pattern**:
```typescript
// Inject HttpClient + AuthService for API calls
constructor(
  private http: HttpClient,
  private authService: AuthService
) {}

// Include X-Store-Id header in all requests
getItems() {
  const headers = { 'X-Store-Id': this.authService.currentStoreId };
  return this.http.get('/api/items', { headers });
}
```

### Database Entities

**Base Entities** (`backend/src/database/entities/base.entity.ts`):
- `BaseEntity`: UUID primary key + `created_at`/`updated_at` timestamps
- `TenantBaseEntity`: Extends BaseEntity, adds indexed `store_id` column

**Key Relationships**:
- `User` ↔ `UserStore` ↔ `Store` (many-to-many with roles)
- `Store` → all tenant entities (one-to-many)
- `Product` → `Category` (many-to-one, hierarchical categories via `parent_id`)
- `Product` → `InventoryBatch` (one-to-many, FIFO selection by `purchase_date`)
- `Sale` → `SaleItem` → `InventoryBatch` (tracks which batches used in sales)

**FIFO Inventory**: When creating sales, query `inventory_batches` ordered by `purchase_date ASC`, select oldest batches first until quantity met.

### Authentication Flow

**Login**: Returns JWT + list of accessible stores + default store
**Multi-Store Access**: Users can belong to multiple stores with different roles per store
**Store Switching**: POST `/api/auth/switch-store` with new `store_id` (validates access)

## Critical Business Logic

### FIFO Batch Selection (for Sales Module)
```typescript
// Select batches ordered by purchase_date ASC
// Accumulate from oldest until quantity met
// Track which batches/quantities used for each sale item
const batches = await repository.find({
  where: { product_id, store_id, is_active: true, current_quantity: MoreThan(0) },
  order: { purchase_date: 'ASC' }
});
```

### VAT Calculation (Philippine 12% Tax)
```typescript
subtotal = sum(item_prices)
tax_amount = subtotal * 0.12
total_amount = subtotal + tax_amount - discount
```

### Sales Transaction (Atomic)
Must use database transaction to:
1. Validate customer credit limit (if credit/partial payment)
2. Select batches (FIFO) for each item
3. Create `Sale` record with generated `sale_number`
4. Create `SaleItem` records linking to batches
5. Deduct `current_quantity` from each batch
6. Create `StockMovement` records (type: 'sale', negative quantity)
7. Update `Customer.current_balance` if credit purchase

### Returns/Refunds
Reverse the sale transaction:
- Create return sale (negative quantities/amounts)
- Restock original batches
- Create stock movements (type: 'return', positive quantity)
- Reduce customer balance if original was credit

## File Locations

**Backend Source**: `backend/src/`
- **Entities**: `database/entities/` (14 entities total)
- **Migrations**: `database/migrations/` (1707000000000-InitialSchema.ts)
- **Auth**: `auth/` (Supabase + JWT integration)
- **Common**: `common/` (guards, decorators, interceptors, filters)
- **Config**: `config/` (environment, database, Supabase)
- **Modules**: `stores/`, `categories/`, `products/`, `inventory/`, `sales/`, `receipts/`, `reports/`, `users/`

**Frontend Source**: `frontend/src/`
- **App**: `app/` (standalone components, Angular 21)
- **Features**: `app/features/` (auth, pos, products, inventory, sales, customers, reports, dashboard, settings)
- **Core**: `app/core/` (services, guards, interceptors)
- **Shared**: `app/shared/` (components, directives, pipes)
- **Assets**: `assets/` (images, styles, i18n)

**Component Structure** (multi-file pattern):
```
feature-name/
├── feature-name.ts          # Component logic
├── feature-name.html        # Template
├── feature-name.scss        # Scoped styles
└── feature-name.spec.ts     # Unit tests
```

**API Endpoints**:
- Base path: `/api`
- Auth: `/api/auth/login`, `/api/auth/register`, `/api/auth/switch-store`
- All other endpoints require `Authorization` + `X-Store-Id` headers

## Implementation Notes

**Completed - Backend (Phases 1-8)**:
- ✅ Database schema (14 tables with multi-tenant isolation)
- ✅ Multi-tenant guards and interceptors (`TenantGuard`, `RolesGuard`)
- ✅ Authentication module (Supabase + JWT, store switching)
- ✅ Stores module (CRUD + settings management)
- ✅ Categories module (hierarchical categories with parent/child)
- ✅ Products module (retail/cost pricing, stock tracking)
- ✅ Inventory module (FIFO batch management, stock movements)
- ✅ Sales module (atomic transactions, FIFO deduction, credit validation)
- ✅ Receipts module (thermal printer support, BIR compliance)
- ✅ Reports module (sales, inventory, customer statements)
- ✅ Users module (store assignment, role management)
- ✅ Customers module (credit limit, utang tracking)

**Completed - Frontend (Phase 9)**:
- ✅ Angular 21 + PrimeNG setup (standalone components)
- ✅ Authentication flow (login, register, store switching)
- ✅ POS page (product selection, cart, checkout)
- ✅ Products management (CRUD, categories, pricing)
- ✅ Inventory management (batches, stock movements, FIFO tracking)
- ✅ Sales history (search, filters, details)
- ✅ Customers management (credit limits, payment tracking)
- ✅ Reports & Dashboard (sales charts, inventory stats)
- ✅ Settings page (store config, user profile)
- ✅ UI/UX Modernization Phase 1 (login + reports with modern design)

**To Implement (Phase 10 - Testing & Deployment)**:
- Unit tests for backend services (Jest)
- E2E tests for critical flows (sales, inventory)
- Frontend unit tests (Jasmine/Karma)
- Integration tests (API + database)
- Performance optimization (lazy loading, caching)
- Production deployment setup (Vercel + Supabase)
- CI/CD pipeline (GitHub Actions)
- User documentation and training materials

**UI/UX Modernization Standards**:
- Modern gradient backgrounds (linear-gradient with brand colors)
- Smooth animations and hover effects (transform, box-shadow)
- Emoji icons for visual hierarchy (📊 📈 📦 💰 etc.)
- Trend indicators with arrows (↑ ↓) and color coding (green/red)
- Empty states with CTAs linking to relevant actions
- Professional typography (Inter font family)
- Responsive layouts with proper spacing
- Gradient charts (area fills for line charts, gradient bars)
- Card-based layouts with subtle shadows
- Brand consistency (purple/blue gradient theme)

**Key Considerations**:
- Always apply `TenantGuard` to tenant-specific endpoints
- Use database transactions for sales/returns
- Follow FIFO strictly for inventory deductions
- Generate unique `sale_number` per store (e.g., "SALE-20260205-0001")
- Philippine BIR compliance: Include store TIN in receipts, 12% VAT
- Customer credit ("utang"): Validate against `credit_limit` before allowing credit sales

## Additional Documentation

- `README.md` - Quick start and project overview
- `ARCHITECTURE.md` - Detailed architecture diagrams and flows
- `IMPLEMENTATION_GUIDE.md` - Step-by-step module implementation instructions
- `PROJECT_SUMMARY.md` - Comprehensive feature specifications
