# POS Backend

NestJS backend for the Multi-Tenant POS & Inventory Management System.

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials and database URL
3. Generate a secure JWT secret

## Database Setup

```bash
# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration from entity changes
npm run migration:generate src/database/migrations/MigrationName
```

## Running the App

```bash
# Development with watch mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Documentation

Base URL: `http://localhost:3000/api`

### Authentication Endpoints

#### POST `/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

#### POST `/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  },
  "stores": [
    {
      "id": "store_uuid",
      "name": "Store Name",
      "role": "admin",
      "is_default": true
    }
  ],
  "default_store": {
    "id": "store_uuid",
    "name": "Store Name",
    "role": "admin"
  }
}
```

#### POST `/auth/switch-store`
Switch to a different store.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "storeId": "store_uuid"
}
```

**Response:**
```json
{
  "store": {
    "id": "store_uuid",
    "name": "Store Name",
    "role": "admin"
  }
}
```

#### GET `/auth/stores`
Get all stores accessible to the current user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": "store_uuid",
    "name": "Store Name",
    "role": "admin",
    "is_default": true
  }
]
```

## Multi-Tenant Request Flow

All tenant-specific endpoints require:

1. **Authorization Header:**
   ```
   Authorization: Bearer {access_token}
   ```

2. **Store ID Header:**
   ```
   X-Store-Id: {store_uuid}
   ```

The `TenantGuard` will automatically validate that the authenticated user has access to the requested store.

## Project Structure

```
src/
├── auth/                  # Authentication & authorization
│   ├── dto/              # Data transfer objects
│   ├── strategies/       # Passport strategies
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── supabase.service.ts
├── common/               # Shared utilities
│   ├── decorators/      # Custom decorators
│   ├── filters/         # Exception filters
│   ├── guards/          # Route guards
│   ├── interceptors/    # Interceptors
│   ├── interfaces/      # TypeScript interfaces
│   └── pipes/           # Validation pipes
├── config/              # Configuration files
│   ├── config.module.ts
│   ├── database.config.ts
│   └── supabase.config.ts
├── database/            # Database layer
│   ├── entities/       # TypeORM entities
│   ├── migrations/     # Database migrations
│   └── database.module.ts
├── app.module.ts        # Root module
└── main.ts              # Application entry point
```

## Entities

- **Store**: Tenant/store information
- **User**: User accounts
- **UserStore**: User-store associations with roles
- **Category**: Product categories
- **Product**: Product master data
- **Supplier**: Supplier information
- **InventoryBatch**: Batch/lot inventory tracking
- **Customer**: Customer information with credit management
- **Sale**: Sales transactions
- **SaleItem**: Sale line items
- **CreditPayment**: Customer payment records
- **StockMovement**: Inventory movement audit trail
- **LowStockAlert**: Stock and expiry alerts

## Guards

### AuthGuard
Ensures the request has a valid JWT token.

### TenantGuard
Validates that the authenticated user has access to the requested store (via `X-Store-Id` header).

### RolesGuard
Checks if the user has the required role (admin/cashier) for the endpoint.

## Decorators

### @CurrentUser()
Injects the current authenticated user into the controller method.

### @CurrentStore()
Injects the current store ID into the controller method.

### @Roles()
Specifies required roles for an endpoint.

## Environment Variables

Required variables:

```env
NODE_ENV=development
PORT=3000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
FRONTEND_URL=http://localhost:4200
```

## Development Tips

1. **Always use guards**: Protect routes with `@UseGuards(AuthGuard('jwt'), TenantGuard)`
2. **Inject store context**: Use `@CurrentStore()` to get the current store ID
3. **Validation**: DTOs are automatically validated using class-validator
4. **Transactions**: Use TypeORM transactions for operations that modify multiple tables
5. **Logging**: Add proper logging for debugging

## Next Steps

See `IMPLEMENTATION_GUIDE.md` in the root directory for detailed instructions on implementing remaining modules.

## License

Proprietary
