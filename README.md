# Multi-Tenant POS & Inventory Management System

A comprehensive Point of Sale and Inventory Management System designed for small retail stores in the Philippines with multi-tenant support, batch-based inventory tracking, customer credit management, and flexible pricing.

## Project Status

✅ **Phase 1 Complete**: Backend Foundation
- Database schema and entities created
- Multi-tenant architecture with Row-Level Security
- Authentication module with Supabase integration
- JWT-based authentication with store switching
- User-store association for multi-store access

## Tech Stack

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL via Supabase
- **ORM**: TypeORM
- **Authentication**: Supabase Auth + JWT
- **Language**: TypeScript

### Frontend (To be implemented)
- **Framework**: Angular 17+ (standalone components)
- **State Management**: RxJS
- **UI Library**: TBD (PrimeNG or Angular Material)

## Project Structure

```
POS/
├── backend/
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── common/            # Guards, decorators, interceptors
│   │   ├── config/            # Configuration files
│   │   ├── database/          # Entities and migrations
│   │   └── main.ts            # Application entry point
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Database Schema

### Core Tables
- **stores**: Tenant/store management
- **users**: User accounts
- **user_stores**: User-store associations with roles
- **categories**: Product categories with hierarchy
- **products**: Product master data
- **suppliers**: Supplier information
- **inventory_batches**: Batch/lot tracking with FIFO
- **customers**: Customer management with credit limits
- **sales**: Sales transactions
- **sale_items**: Sales line items
- **credit_payments**: Customer payment history (utang)
- **stock_movements**: Inventory audit trail
- **low_stock_alerts**: Stock and expiry alerts

## Features

### Implemented
- ✅ Multi-tenant architecture with store isolation
- ✅ User authentication with Supabase
- ✅ JWT-based authorization
- ✅ Multi-store access per user
- ✅ Store switching capability
- ✅ Role-based access control (Admin, Cashier)
- ✅ Complete database schema with migrations

### To Be Implemented
- ⏳ Product management module
- ⏳ Inventory management with FIFO batch selection
- ⏳ POS interface with barcode scanning
- ⏳ Customer credit management
- ⏳ Sales transactions with returns/refunds
- ⏳ Receipt generation (PDF + thermal printer)
- ⏳ Reporting and analytics
- ⏳ Low stock and expiry alerts (cron jobs)
- ⏳ Frontend application

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (via Supabase)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
NODE_ENV=development
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION=7d
```

5. Run migrations:
```bash
npm run migration:run
```

6. Start development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/switch-store` - Switch active store
- `GET /api/auth/stores` - Get user's accessible stores

### Multi-Tenant Flow
1. User logs in → receives JWT token + list of accessible stores
2. Frontend stores token and default store ID
3. All API requests include:
   - `Authorization: Bearer <token>` header
   - `X-Store-Id: <store_id>` header
4. Backend validates user access to store via TenantGuard
5. All queries automatically filtered by store_id

## Multi-Tenant Architecture

### Key Components
- **TenantGuard**: Validates user access to requested store
- **TenantInterceptor**: Injects store context into requests
- **TenantBaseEntity**: Base entity with store_id column
- **UserStore**: Junction table for user-store associations

### Security
- Row-Level Security via store_id filtering
- JWT tokens contain user identity
- Store access validated on every request
- Role-based permissions per store

## Philippine Market Features

- Fixed 12% VAT (Value Added Tax)
- BIR TIN (Tax Identification Number) support
- Customer credit management (utang system)
- Philippine Peso (PHP) currency
- Receipt formats compliant with BIR requirements

## Development Roadmap

### Phase 1: Backend Foundation ✅
- Database schema design
- Multi-tenant architecture
- Authentication and authorization
- Core entities and migrations

### Phase 2: Core Modules (In Progress)
- Product and category management
- Supplier management
- Inventory batch tracking
- Customer management

### Phase 3: POS Module
- Sales transaction processing
- FIFO inventory deduction
- Credit/utang handling
- Returns and refunds

### Phase 4: Reports & Alerts
- Sales reports
- Inventory reports
- Customer statements
- Low stock alerts
- Expiry warnings

### Phase 5: Frontend Application
- Angular application setup
- Authentication UI
- Dashboard
- POS interface
- Management interfaces

### Phase 6: Advanced Features
- Receipt printing (PDF + thermal)
- Barcode scanning
- Multi-device support
- Offline mode
- Export capabilities

## Contributing

This is a private project. For questions or suggestions, please contact the development team.

## License

Proprietary - All rights reserved

## Next Steps

1. **Backend Development**:
   - Implement remaining modules (products, inventory, sales, etc.)
   - Add business logic for FIFO inventory
   - Create receipt generation services
   - Set up cron jobs for alerts

2. **Frontend Development**:
   - Initialize Angular project
   - Create authentication pages
   - Build POS interface
   - Implement management dashboards

3. **Testing**:
   - Unit tests for services
   - Integration tests for APIs
   - E2E tests for critical flows

4. **Deployment**:
   - Set up CI/CD pipeline
   - Configure production environment
   - Deploy to Railway (backend)
   - Deploy to Vercel (frontend)
