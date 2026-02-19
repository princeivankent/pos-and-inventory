# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (Angular 21)                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │   POS    │  │ Products │  │ Reports  │   │
│  │  Pages   │  │Interface │  │   Mgmt   │  │Analytics │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Auth Interceptor + Tenant Interceptor        │  │
│  │    (Adds JWT Token + X-Store-Id to all requests)    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│                        (NestJS)                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Guards & Interceptors                    │  │
│  │  ┌───────┐ ┌────────┐ ┌───────┐ ┌─────────────┐     │  │
│  │  │ Auth  │>│ Tenant │>│ Roles │>│ Permissions │     │  │
│  │  │ Guard │ │ Guard  │ │ Guard │ │   Guard     │     │  │
│  │  └───────┘ └────────┘ └───────┘ └─────────────┘     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 Business Modules                      │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│  │
│  │  │Products │  │Inventory│  │  Sales  │  │Customers││  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘│  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│  │
│  │  │ Reports │  │  Users  │  │Receipts │  │  Auth   ││  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   TypeORM Layer                       │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                      │
│                      (via Supabase)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Database Tables                      │  │
│  │  • stores            • products       • sales         │  │
│  │  • users             • suppliers      • sale_items    │  │
│  │  • user_stores       • inventory_batches              │  │
│  │  • categories        • customers      • credit_payments│ │
│  │  • stock_movements   • low_stock_alerts               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Row-Level Security (RLS) Policies            │  │
│  │           (All queries filtered by store_id)          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Multi-Tenant Request Flow

```
1. User Login
   ┌──────┐         ┌──────────┐         ┌──────────┐
   │Client│────────>│  Backend │────────>│ Supabase │
   └──────┘         │   Auth   │         │   Auth   │
      │             └──────────┘         └──────────┘
      │                    │                    │
      │<───────────────────┴────────────────────┘
      │   JWT Token + User Stores List
      │

2. Store Selection (if multiple stores)
   ┌──────┐
   │Client│ Stores JWT + Selected Store ID in state
   └──────┘

3. API Request with Multi-Tenant Context
   ┌──────┐         ┌──────────────────────────┐
   │Client│────────>│ Headers:                  │
   └──────┘         │ - Authorization: Bearer {JWT}
                    │ - X-Store-Id: {store_id} │
                    └──────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   AuthGuard      │
                    │ Validates JWT    │
                    │ Extracts user_id │
                    └────────┬─────────┘
                             │ ✓ Valid
                             ▼
                    ┌──────────────────┐
                    │   TenantGuard    │
                    │ Validates user   │
                    │ has access to    │
                    │ requested store  │
                    └────────┬─────────┘
                             │ ✓ Authorized
                             ▼
                    ┌──────────────────┐
                    │   RolesGuard     │
                    │ Validates user   │
                    │ role for action  │
                    └────────┬─────────┘
                             │ ✓ Permitted
                             ▼
                    ┌──────────────────┐
                    │ Controller       │
                    │ Receives request │
                    │ with context:    │
                    │ - userId         │
                    │ - storeId        │
                    │ - role           │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Service Layer    │
                    │ Queries filtered │
                    │ by store_id      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Database         │
                    │ WHERE store_id = │
                    └──────────────────┘
```

## Database Schema Relationships

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│  stores  │       │ user_stores  │       │  users   │
│          │       │              │       │          │
│ id (PK)  │<──────┤ store_id (FK)│       │ id (PK)  │
│ name     │       │ user_id (FK) │──────>│ email    │
│ settings │       │ role         │       │ full_name│
└──────────┘       │ is_default   │       └──────────┘
      │            └──────────────┘
      │
      │ All tenant tables have store_id FK
      │
      ├─────>┌────────────┐
      │      │ categories │
      │      │ id (PK)    │
      │      │ store_id   │
      │      │ name       │
      │      │ parent_id  │
      │      └──────┬─────┘
      │             │
      ├─────>┌─────┴──────┐
      │      │  products  │
      │      │ id (PK)    │
      │      │ store_id   │
      │      │ category_id│
      │      │ sku        │
      │      │ barcode    │
      │      └──────┬─────┘
      │             │
      ├─────>┌─────┴──────────────┐
      │      │ inventory_batches  │
      │      │ id (PK)            │
      │      │ store_id           │
      │      │ product_id (FK)    │
      │      │ batch_number       │
      │      │ purchase_date      │
      │      │ expiry_date        │
      │      │ current_quantity   │
      │      │ wholesale_price    │
      │      │ retail_price       │
      │      └──────┬─────────────┘
      │             │
      ├─────>┌─────┴─────┐
      │      │ customers │
      │      │ id (PK)   │
      │      │ store_id  │
      │      │ name      │
      │      │ credit_limit│
      │      │ current_balance│
      │      └──────┬────┘
      │             │
      ├─────>┌─────┴────┐      ┌──────────────┐
      │      │  sales   │<─────│  sale_items  │
      │      │ id (PK)  │      │ id (PK)      │
      │      │ store_id │      │ sale_id (FK) │
      │      │ sale_number│    │ product_id   │
      │      │ customer_id│    │ batch_id (FK)│
      │      │ subtotal  │     │ quantity     │
      │      │ tax_amount│     │ unit_price   │
      │      │ total_amount│   └──────────────┘
      │      │ payment_method│
      │      └───────────┘
      │
      ├─────>┌─────────────────┐
      │      │ credit_payments │
      │      │ id (PK)         │
      │      │ store_id        │
      │      │ customer_id (FK)│
      │      │ sale_id (FK)    │
      │      │ amount          │
      │      └─────────────────┘
      │
      ├─────>┌──────────────────┐
      │      │ stock_movements  │
      │      │ id (PK)          │
      │      │ store_id         │
      │      │ batch_id (FK)    │
      │      │ movement_type    │
      │      │ quantity         │
      │      └──────────────────┘
      │
      └─────>┌──────────────────┐
             │ low_stock_alerts │
             │ id (PK)          │
             │ store_id         │
             │ product_id (FK)  │
             │ alert_type       │
             │ is_resolved      │
             └──────────────────┘
```

## Sale Transaction Flow

```
1. Create Sale Request
   ┌──────────────────────────────────────┐
   │ Sale Data:                           │
   │ - items: [{product_id, quantity}]    │
   │ - customer_id (optional)             │
   │ - payment_method (cash/credit/partial)│
   │ - amount_paid                        │
   │ - discount                           │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 2. Validate Customer Credit          │
   │    (if credit/partial)               │
   │    current_balance + total_amount    │
   │    <= credit_limit                   │
   └──────────────┬───────────────────────┘
                  │ ✓ Valid
                  ▼
   ┌──────────────────────────────────────┐
   │ 3. Select Batches (FIFO)             │
   │    For each item:                    │
   │    - Query active batches            │
   │    - Order by purchase_date ASC      │
   │    - Select oldest first             │
   │    - Accumulate until quantity met   │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 4. Calculate Totals                  │
   │    subtotal = sum(item.subtotals)    │
   │    tax = subtotal × 0.12 (VAT)       │
   │    total = subtotal + tax - discount │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 5. Start Database Transaction        │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 6. Create Sale Record                │
   │    - Generate sale_number            │
   │    - Store totals and payment info   │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 7. Create Sale Items                 │
   │    For each selected batch:          │
   │    - Create sale_item record         │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 8. Deduct Stock from Batches         │
   │    For each selected batch:          │
   │    - batch.current_quantity -= qty   │
   │    - Update batch record             │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 9. Record Stock Movements            │
   │    For each batch:                   │
   │    - movement_type: 'sale'           │
   │    - quantity: -qty (negative)       │
   │    - reference: sale_id              │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 10. Update Customer Balance          │
   │     (if credit/partial)              │
   │     customer.current_balance += credit│
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 11. Commit Transaction               │
   └──────────────┬───────────────────────┘
                  │ ✓ Success
                  ▼
   ┌──────────────────────────────────────┐
   │ 12. Return Sale Receipt Data         │
   │     - sale_number                    │
   │     - items with prices              │
   │     - totals                         │
   │     - payment details                │
   └──────────────────────────────────────┘
```

## Return/Refund Flow

```
1. Return Request
   ┌──────────────────────────────────────┐
   │ - original_sale_id                   │
   │ - items_to_return: [{sale_item_id,   │
   │                      quantity}]      │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 2. Validate Original Sale            │
   │    - Sale exists                     │
   │    - Sale not already returned       │
   │    - Items valid                     │
   └──────────────┬───────────────────────┘
                  │ ✓ Valid
                  ▼
   ┌──────────────────────────────────────┐
   │ 3. Start Database Transaction        │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 4. Create Return Sale                │
   │    - status: 'returned'              │
   │    - returned_from_sale_id: original │
   │    - negative quantities             │
   │    - negative totals                 │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 5. Create Return Sale Items          │
   │    (with negative quantities)        │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 6. Restock Original Batches          │
   │    For each returned item:           │
   │    - Find original batch             │
   │    - batch.current_quantity += qty   │
   │    - Update batch record             │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 7. Record Stock Movements            │
   │    - movement_type: 'return'         │
   │    - quantity: +qty (positive)       │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 8. Update Customer Balance           │
   │    (if original was credit)          │
   │    customer.current_balance -= amount│
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │ 9. Commit Transaction                │
   └──────────────┬───────────────────────┘
                  │ ✓ Success
                  ▼
   ┌──────────────────────────────────────┐
   │ 10. Calculate Refund Amount          │
   │     Return refund details            │
   └──────────────────────────────────────┘
```

## FIFO Batch Selection Algorithm

```
Input: product_id, quantity_needed, store_id

1. Query active batches:
   ┌─────────────────────────────────────┐
   │ SELECT * FROM inventory_batches     │
   │ WHERE product_id = ?                │
   │   AND store_id = ?                  │
   │   AND is_active = true              │
   │   AND current_quantity > 0          │
   │ ORDER BY purchase_date ASC          │
   └──────────────┬──────────────────────┘
                  │
                  ▼
2. Initialize:
   selected_batches = []
   remaining_quantity = quantity_needed

3. For each batch in query results:
   ┌─────────────────────────────────────┐
   │ If remaining_quantity <= 0:         │
   │    BREAK                            │
   │                                     │
   │ quantity_from_batch = MIN(          │
   │    batch.current_quantity,          │
   │    remaining_quantity               │
   │ )                                   │
   │                                     │
   │ selected_batches.push({             │
   │    batch_id,                        │
   │    quantity: quantity_from_batch,   │
   │    unit_price: batch.retail_price   │
   │ })                                  │
   │                                     │
   │ remaining_quantity -= quantity_from_batch│
   └──────────────┬──────────────────────┘
                  │
                  ▼
4. Validate:
   ┌─────────────────────────────────────┐
   │ If remaining_quantity > 0:          │
   │    THROW InsufficientStockError     │
   └──────────────┬──────────────────────┘
                  │ ✓ All quantity available
                  ▼
5. Return selected_batches

Example:
  Need 100 units
  Batch A: 50 units (2026-01-01) → Take 50
  Batch B: 30 units (2026-01-15) → Take 30
  Batch C: 40 units (2026-02-01) → Take 20
  Result: 50 + 30 + 20 = 100 ✓
```

## Alert Generation Cron Job

```
Daily at 6:00 AM

┌────────────────────────────────────────┐
│ 1. Get All Active Stores               │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ 2. For Each Store:                     │
│                                        │
│    a. Low Stock Check                  │
│    ┌────────────────────────────────┐ │
│    │ Get products where total       │ │
│    │ current_quantity <= reorder_level│ │
│    │                                │ │
│    │ Create alert if not exists     │ │
│    │ (type: low_stock/out_of_stock) │ │
│    └────────────────────────────────┘ │
│                                        │
│    b. Expiry Check                     │
│    ┌────────────────────────────────┐ │
│    │ Get batches where              │ │
│    │ expiry_date <= NOW() + 30 days │ │
│    │                                │ │
│    │ Create alert if not exists     │ │
│    │ (type: near_expiry)            │ │
│    └────────────────────────────────┘ │
│                                        │
│    c. Expired Batch Check              │
│    ┌────────────────────────────────┐ │
│    │ Get batches where              │ │
│    │ expiry_date < NOW()            │ │
│    │                                │ │
│    │ Create alert                   │ │
│    │ Mark batch as inactive         │ │
│    │ (type: expired)                │ │
│    └────────────────────────────────┘ │
└────────────────────────────────────────┘
```

## Deployment Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Users/Browsers                       │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │   Vercel CDN/Edge     │
           │   (Frontend - Angular) │
           └────────────┬───────────┘
                        │ API Calls
                        ▼
           ┌────────────────────────┐
           │      Railway           │
           │  (Backend - NestJS)    │
           └────────────┬───────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │      Supabase          │
           │  (PostgreSQL Database) │
           │  (Authentication)      │
           └────────────────────────┘
```

---

This architecture ensures:
- **Scalability**: Multi-tenant design supports unlimited stores
- **Security**: Multiple layers of authentication and authorization
- **Data Integrity**: FIFO logic and transactional operations
- **Performance**: Proper indexing and query optimization
- **Maintainability**: Clean separation of concerns
