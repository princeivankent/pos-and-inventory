# Quick Start Guide

Get the POS system up and running in minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (recommend using Supabase)
- Git
- Code editor (VS Code recommended)

## 1. Setup Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note down:
   - Project URL
   - Anon/Public key
   - Service role key (keep secret!)
4. Get database connection string from Settings > Database

## 2. Clone and Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

## 3. Configure Environment

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=3000

# From Supabase project settings
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# From Supabase database settings (Connection string > URI)
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres

# Generate a strong secret (can use: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRATION=7d

# Optional: Frontend URL for CORS
FRONTEND_URL=http://localhost:4200
```

## 4. Run Database Migrations

```bash
# Run migrations to create all tables
npm run migration:run
```

Expected output:
```
query: SELECT * FROM "migrations" ...
Migration InitialSchema1707000000000 has been executed successfully.
```

## 5. Start Development Server

```bash
npm run start:dev
```

Expected output:
```
[Nest] 12345  - 02/05/2026, 10:30:00 AM     LOG [NestApplication] Nest application successfully started
Application is running on: http://localhost:3000/api
```

## 6. Test the API

### Test Health Check (if you add one)
```bash
curl http://localhost:3000/api
```

### Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "full_name": "Admin User"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "full_name": "Admin User"
  },
  "stores": [],
  "default_store": null
}
```

## 7. Create Sample Data (Optional)

You'll need to manually insert some sample data or create seed scripts:

### Create a Store
```sql
INSERT INTO stores (id, name, address, phone, tax_id)
VALUES (
  gen_random_uuid(),
  'Sample Store',
  '123 Main St, Manila',
  '09123456789',
  '123-456-789-000'
);
```

### Assign User to Store
```sql
INSERT INTO user_stores (user_id, store_id, role, is_default)
VALUES (
  'your-user-id-from-registration',
  'store-id-from-above',
  'admin',
  true
);
```

## 8. Common Issues

### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: Check DATABASE_URL in .env file, ensure Supabase database is accessible.

### Migration Error
```
QueryFailedError: relation "stores" already exists
```
**Solution**: Migrations already ran. If you need to reset:
```bash
# WARNING: This deletes all data
npm run migration:revert
npm run migration:run
```

### JWT Error
```
UnauthorizedException: Invalid token
```
**Solution**: Check JWT_SECRET matches between token generation and validation.

### CORS Error (from frontend)
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution**: Add frontend URL to FRONTEND_URL in .env file.

## 9. Next Steps

1. **Create More Modules**: Follow IMPLEMENTATION_GUIDE.md to create remaining modules
2. **Add Seed Data**: Create sample products, categories, suppliers
3. **Build Frontend**: Initialize Angular project
4. **Test Features**: Test each module as you build it

## Development Workflow

```bash
# Start backend in watch mode
npm run start:dev

# In another terminal, run tests
npm run test

# Generate a new module
nest g module products
nest g controller products
nest g service products
```

## Useful Commands

```bash
# Backend
npm run start:dev          # Start in development mode
npm run build              # Build for production
npm run start:prod         # Run production build
npm run lint               # Run linter
npm run test               # Run tests
npm run migration:generate # Generate migration from entities
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration

# Database (using psql)
psql $DATABASE_URL         # Connect to database
\dt                        # List tables
\d stores                  # Describe stores table
```

## Project Structure Reminder

```
backend/src/
├── auth/              # ✅ Authentication (done)
├── common/            # ✅ Guards, decorators (done)
├── config/            # ✅ Configuration (done)
├── database/          # ✅ Entities, migrations (done)
├── products/          # ⏳ To implement
├── categories/        # ⏳ To implement
├── suppliers/         # ⏳ To implement
├── inventory/         # ⏳ To implement
├── customers/         # ⏳ To implement
├── sales/             # ⏳ To implement
├── reports/           # ⏳ To implement
├── receipts/          # ⏳ To implement
├── alerts/            # ⏳ To implement
└── main.ts            # ✅ Entry point (done)
```

## Getting Help

- **NestJS**: https://docs.nestjs.com
- **TypeORM**: https://typeorm.io
- **Supabase**: https://supabase.com/docs
- **Project Issues**: Check README.md and IMPLEMENTATION_GUIDE.md

## Ready to Code!

Your backend foundation is ready. Follow the IMPLEMENTATION_GUIDE.md to implement the remaining modules. Start with simpler modules like Products and Categories, then move to more complex ones like Sales and Inventory.

Happy coding! 🚀
