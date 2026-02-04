# Implementation Guide

This guide provides step-by-step instructions for completing the POS system implementation.

## Current Status

✅ **Completed**:
- Backend project structure
- Database entities (all 14 tables)
- Base entity with tenant isolation
- Authentication module with Supabase
- JWT strategy and guards
- Multi-tenant guards and interceptors
- Database migration for initial schema
- Configuration modules

## Next Implementation Steps

### Step 1: Create Remaining Backend Modules

You need to create the following modules to complete the backend:

#### A. Products Module
Files to create:
- `src/products/products.module.ts`
- `src/products/products.service.ts`
- `src/products/products.controller.ts`
- `src/products/dto/create-product.dto.ts`
- `src/products/dto/update-product.dto.ts`

Features:
- CRUD operations for products
- Barcode search
- SKU validation
- Product filtering by category
- Active/inactive status management

#### B. Categories Module
Files to create:
- `src/categories/categories.module.ts`
- `src/categories/categories.service.ts`
- `src/categories/categories.controller.ts`
- `src/categories/dto/create-category.dto.ts`
- `src/categories/dto/update-category.dto.ts`

Features:
- Hierarchical category management
- Parent-child relationships
- Category tree retrieval

#### C. Suppliers Module
Files to create:
- `src/suppliers/suppliers.module.ts`
- `src/suppliers/suppliers.service.ts`
- `src/suppliers/suppliers.controller.ts`
- `src/suppliers/dto/create-supplier.dto.ts`
- `src/suppliers/dto/update-supplier.dto.ts`

Features:
- Supplier CRUD operations
- Contact management
- Supplier search and filtering

#### D. Inventory Module
Files to create:
- `src/inventory/inventory.module.ts`
- `src/inventory/inventory.service.ts`
- `src/inventory/inventory.controller.ts`
- `src/inventory/dto/create-batch.dto.ts`
- `src/inventory/dto/adjust-stock.dto.ts`

Features:
- Batch creation and management
- FIFO batch selection for sales
- Stock adjustments
- Expiry date tracking
- Current stock calculation per product
- Batch restock for returns

Key Methods:
```typescript
async getAvailableBatches(productId: string, storeId: string)
async selectBatchesForSale(productId: string, quantity: number, storeId: string)
async deductStock(batchId: string, quantity: number, storeId: string)
async restockBatch(batchId: string, quantity: number, storeId: string)
```

#### E. Customers Module
Files to create:
- `src/customers/customers.module.ts`
- `src/customers/customers.service.ts`
- `src/customers/customers.controller.ts`
- `src/customers/dto/create-customer.dto.ts`
- `src/customers/dto/update-customer.dto.ts`

Features:
- Customer CRUD operations
- Credit limit management
- Balance tracking
- Customer search
- Credit validation before sale

Key Methods:
```typescript
async validateCreditPurchase(customerId: string, amount: number)
async updateBalance(customerId: string, amount: number)
async getCustomerStatement(customerId: string)
```

#### F. Sales Module
Files to create:
- `src/sales/sales.module.ts`
- `src/sales/sales.service.ts`
- `src/sales/sales.controller.ts`
- `src/sales/dto/create-sale.dto.ts`
- `src/sales/dto/return-sale.dto.ts`

Features:
- Sales transaction processing
- Automatic batch selection (FIFO)
- VAT calculation (12%)
- Payment processing (cash, credit, partial)
- Sale number generation
- Returns/refunds handling
- Stock movement recording

Key Methods:
```typescript
async createSale(createSaleDto: CreateSaleDto, storeId: string, userId: string)
async returnSale(returnSaleDto: ReturnSaleDto, storeId: string, userId: string)
async getSaleDetails(saleId: string, storeId: string)
async getSalesByDateRange(startDate: Date, endDate: Date, storeId: string)
```

Sale Processing Logic:
1. Validate customer credit (if applicable)
2. Select batches for each item (FIFO)
3. Calculate subtotal, VAT (12%), discount
4. Create sale record
5. Create sale items
6. Deduct stock from batches
7. Record stock movements
8. Update customer balance (if credit)
9. Return sale receipt data

#### G. Credit Payments Module
Files to create:
- `src/credit-payments/credit-payments.module.ts`
- `src/credit-payments/credit-payments.service.ts`
- `src/credit-payments/credit-payments.controller.ts`
- `src/credit-payments/dto/record-payment.dto.ts`

Features:
- Record customer payments
- Update customer balance
- Payment history
- Payment allocation to sales

#### H. Reports Module
Files to create:
- `src/reports/reports.module.ts`
- `src/reports/reports.service.ts`
- `src/reports/reports.controller.ts`
- `src/reports/dto/sales-report-query.dto.ts`

Reports to implement:
- Daily/monthly sales reports
- Inventory reports (current stock, batch list)
- Customer balance reports
- Product sales analysis
- Expiring batch reports
- Low stock reports

#### I. Alerts Module
Files to create:
- `src/alerts/alerts.module.ts`
- `src/alerts/alerts.service.ts`
- `src/alerts/alerts.cron.ts`
- `src/alerts/alerts.controller.ts`

Features:
- Low stock detection
- Out of stock alerts
- Near expiry warnings (30 days)
- Expired batch alerts
- Scheduled cron job (daily)
- Alert resolution

Cron Job (runs daily at 6 AM):
```typescript
@Cron('0 6 * * *')
async generateAlerts() {
  // Check all stores
  // Generate low stock alerts
  // Generate expiry alerts
  // Mark expired batches as inactive
}
```

#### J. Receipts Module
Files to create:
- `src/receipts/receipts.module.ts`
- `src/receipts/receipts.service.ts`
- `src/receipts/pdf-receipt.service.ts`
- `src/receipts/thermal-receipt.service.ts`
- `src/receipts/templates/receipt.template.html`

Features:
- PDF receipt generation (for email/download)
- Thermal printer integration (ESC/POS commands)
- Receipt customization per store
- Store branding (logo, footer)

Receipt Format:
```
================================
       STORE NAME
      Store Address
      Phone: xxx-xxxx
      TIN: xxx-xxx-xxx
================================
Date: 2026-02-05 10:30 AM
Invoice: INV-20260205-0001
Cashier: John Doe
================================
ITEM          QTY  PRICE  TOTAL
--------------------------------
Product A       2  50.00  100.00
Product B       1  75.00   75.00
--------------------------------
              SUBTOTAL:  175.00
                   VAT:   21.00
              DISCOUNT:    0.00
--------------------------------
                 TOTAL:  196.00
                  CASH:  200.00
                CHANGE:    4.00
================================
   Thank you for shopping!
================================
```

#### K. Stores Module
Files to create:
- `src/stores/stores.module.ts`
- `src/stores/stores.service.ts`
- `src/stores/stores.controller.ts`
- `src/stores/dto/create-store.dto.ts`
- `src/stores/dto/update-store.dto.ts`

Features:
- Store CRUD operations
- Store settings management
- Logo upload
- Tax configuration

#### L. Users Module
Files to create:
- `src/users/users.module.ts`
- `src/users/users.service.ts`
- `src/users/users.controller.ts`
- `src/users/dto/assign-user-store.dto.ts`

Features:
- User management
- Store assignment
- Role assignment
- Default store configuration

### Step 2: Update App Module

Add all created modules to `app.module.ts`:

```typescript
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
// ... import all modules

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    SuppliersModule,
    InventoryModule,
    CustomersModule,
    SalesModule,
    CreditPaymentsModule,
    ReportsModule,
    AlertsModule,
    ReceiptsModule,
    StoresModule,
    UsersModule,
  ],
  // ...
})
export class AppModule {}
```

### Step 3: Frontend Implementation

After backend completion, create the Angular frontend:

1. **Initialize Angular Project**:
```bash
ng new pos-frontend --standalone --routing --style=scss
cd pos-frontend
```

2. **Install Dependencies**:
```bash
npm install @supabase/supabase-js
npm install primeng primeicons  # or Angular Material
```

3. **Project Structure**:
Follow the structure outlined in the main plan:
- `app/core/` - Services, guards, interceptors
- `app/shared/` - Reusable components
- `app/features/` - Feature modules (auth, pos, products, etc.)

4. **Key Frontend Components**:
- Login/Register pages
- Dashboard with alerts
- POS interface with barcode scanning
- Product management
- Inventory management
- Customer management
- Sales history
- Reports

5. **POS Interface Requirements**:
- Product search (by name, SKU, barcode)
- Shopping cart
- Customer selection
- Price selection (wholesale/retail)
- Payment processing
- Receipt preview/print

### Step 4: Testing

1. **Backend Testing**:
- Test multi-tenant isolation
- Test FIFO inventory selection
- Test sales transaction flow
- Test credit management
- Test returns/refunds

2. **Frontend Testing**:
- Test authentication flow
- Test store switching
- Test POS workflow
- Test receipt generation

### Step 5: Deployment

1. **Backend (Railway)**:
- Connect GitHub repository
- Set environment variables
- Deploy NestJS application

2. **Frontend (Vercel)**:
- Connect GitHub repository
- Set environment variables
- Deploy Angular application

## Key Business Logic

### FIFO Inventory Selection

```typescript
async selectBatchesForSale(productId: string, quantity: number, storeId: string) {
  // Get active batches ordered by purchase_date (FIFO)
  const batches = await this.inventoryBatchRepository.find({
    where: {
      product_id: productId,
      store_id: storeId,
      is_active: true,
      current_quantity: MoreThan(0),
    },
    order: { purchase_date: 'ASC' },
  });

  const selectedBatches = [];
  let remainingQuantity = quantity;

  for (const batch of batches) {
    if (remainingQuantity <= 0) break;

    const quantityToTake = Math.min(batch.current_quantity, remainingQuantity);
    selectedBatches.push({
      batch_id: batch.id,
      quantity: quantityToTake,
      unit_price: batch.retail_price, // or wholesale_price
    });

    remainingQuantity -= quantityToTake;
  }

  if (remainingQuantity > 0) {
    throw new BadRequestException('Insufficient stock');
  }

  return selectedBatches;
}
```

### VAT Calculation (12%)

```typescript
calculateSaleTotals(items: SaleItem[], discount: number = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax_amount = subtotal * 0.12; // 12% VAT
  const total_amount = subtotal + tax_amount - discount;

  return { subtotal, tax_amount, discount, total_amount };
}
```

### Returns Processing

```typescript
async processReturn(originalSaleId: string, returnItems: ReturnItem[], storeId: string) {
  // 1. Get original sale
  // 2. Validate return items
  // 3. Create return sale (negative quantities)
  // 4. Restock batches
  // 5. Update customer balance if credit sale
  // 6. Record stock movements
  // 7. Calculate refund amount
}
```

## Common Patterns

### Repository Pattern with Tenant Filtering

```typescript
async findAllByStore(storeId: string) {
  return this.repository.find({
    where: { store_id: storeId },
  });
}
```

### Controller with Guards

```typescript
@Controller('products')
@UseGuards(AuthGuard('jwt'), TenantGuard)
export class ProductsController {
  @Get()
  async findAll(@CurrentStore() storeId: string) {
    return this.productsService.findAllByStore(storeId);
  }
}
```

## Development Tips

1. **Always use TenantGuard**: Every endpoint that accesses tenant data must use TenantGuard
2. **Use CurrentStore decorator**: Extract storeId from request context
3. **Validate store access**: TenantGuard automatically validates user access
4. **Transaction management**: Use database transactions for sales to ensure atomicity
5. **Error handling**: Use NestJS exception filters for consistent error responses
6. **Logging**: Add proper logging for debugging and audit trails

## Support

For questions or issues during implementation, refer to:
- NestJS documentation: https://docs.nestjs.com
- TypeORM documentation: https://typeorm.io
- Supabase documentation: https://supabase.com/docs
- Angular documentation: https://angular.dev

## Summary

You now have:
1. ✅ Complete database schema with 14 tables
2. ✅ Multi-tenant architecture with security
3. ✅ Authentication system
4. ✅ Foundation for all modules

Next: Implement the remaining modules (A-L above) to complete the backend, then build the Angular frontend.
