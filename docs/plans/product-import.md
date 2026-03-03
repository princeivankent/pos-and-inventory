# Plan: Product Import from Excel

**Status**: Planned — Not yet implemented
**Created**: 2026-03-04
**Priority**: Post-deployment / Phase 11

---

## Context

Customers migrating to this POS system have existing product catalogs in Excel spreadsheets. A one-time bulk import saves hours of manual data entry during onboarding.

The import must be **safe by design**: it must never create a product whose `current_stock > 0` without a corresponding inventory batch, or the POS sale flow will fail at runtime with no batches to deduct from (breaking the FIFO invariant).

---

## The Inventory Batch Problem (Core Safety Rule)

**Invariant that must NEVER be violated**:
> If `product.current_stock > 0`, there must be at least one active `InventoryBatch` with `current_quantity > 0` linked to that product.

**How import respects this**:
- Product + opening balance batch are wrapped in the **same database savepoint**
- If batch INSERT fails → entire savepoint rolled back → product is NOT created either
- `StockMovement` (type: PURCHASE) also created in the same savepoint
- Result: The invariant holds from the first moment after import

### Opening Balance Batch Fields

| Field | Value |
|-------|-------|
| `batch_number` | `IMPORT-{YYYYMMDD}-{SKU}` |
| `purchase_date` | Import date (today) |
| `unit_cost` | From `Cost Price` column (or 0 if blank) |
| `initial_quantity` | From `Current Stock` column |
| `current_quantity` | Same as `initial_quantity` |
| `retail_price` | From `Retail Price` column |
| `wholesale_price` | Same as `unit_cost` |
| `supplier_id` | Match by name if `Supplier` column provided; null if not found (warning, not error) |
| `is_active` | true |

Products with `Current Stock = 0` or blank → product created with no batch (no units to track).

---

## Excel Template Design

**File**: `product-import-template.xlsx`
- **Sheet 1: Products** — header row + data rows
- **Sheet 2: Instructions** — column descriptions, valid values, examples, sample filled row

### Columns

| # | Column | Required | Notes |
|---|--------|----------|-------|
| 1 | Name | **Yes** | Max 255 chars |
| 2 | SKU | No | Auto-generate `SKU-{n}` if blank; must be unique per store |
| 3 | Barcode | No | Optional, max 100 chars |
| 4 | Category | No | Match by name (case-insensitive); row fails if category not found |
| 5 | Unit | No | Default: `pcs` |
| 6 | Retail Price | **Yes** | Positive number (₱) |
| 7 | Cost Price | No | Default: 0 |
| 8 | Current Stock | No | Non-negative integer; default: 0 |
| 9 | Reorder Level | No | Non-negative integer; default: 0 |
| 10 | Has Expiry | No | `Yes` or `No`; default: `No` |
| 11 | Description | No | Free text |
| 12 | Supplier | No | Match by name (case-insensitive); if not found, batch created without supplier link (warning only) |

---

## Confirmed Design Decisions

| Scenario | Behavior |
|----------|----------|
| SKU already exists in store | **Skip** — row counted as "skipped", product unchanged. Safe for re-running the same import. |
| Category name not found in store | **Fail the row** — error: "Category 'X' not found. Create it first." Keeps taxonomy clean. |
| Supplier name not found | **Warning only** — batch created without `supplier_id`. Not a failure. |
| `current_stock = 0` or blank | Product created with no batch. No stock movement. |

---

## Two-Phase Import Flow (Dry-Run → Commit)

### Phase 1: Preview / Dry-Run

**Endpoint**: `POST /api/products/import/preview`

- Accepts `.xlsx` file (multipart/form-data, max 5 MB)
- Parses all rows, runs all validation
- Checks: required fields, number formats, SKU uniqueness (DB + within file), plan limit
- **Does NOT write to the database**
- Returns:

```json
{
  "total_rows": 120,
  "valid": 115,
  "skipped": 3,
  "errors": 2,
  "will_create_batches": 90,
  "row_results": [
    { "row": 5, "status": "error", "column": "Retail Price", "reason": "Not a valid number" },
    { "row": 12, "status": "skipped", "reason": "SKU 'ABC-001' already exists" },
    { "row": 20, "status": "warning", "column": "Supplier", "reason": "Supplier 'ACME' not found — batch will be created without supplier link" }
  ]
}
```

### Phase 2: Commit

**Endpoint**: `POST /api/products/import/commit`

- Accepts the same `.xlsx` file
- Re-runs validation (in case data changed between preview and commit)
- Processes each valid row in its own database **savepoint**:

```
BEGIN TRANSACTION
  For each valid row:
    SAVEPOINT row_N
      INSERT product
      IF current_stock > 0:
        INSERT inventory_batch  (opening balance)
        INSERT stock_movement   (type: PURCHASE)
      IF any error:
        ROLLBACK TO SAVEPOINT row_N
        Log failure
      ELSE:
        RELEASE SAVEPOINT row_N
COMMIT
```

- Returns: `{ succeeded, skipped, failed, errors: [{row, reason}] }`

---

## Limits

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Max file size | 5 MB | Prevents memory issues |
| Max rows | 500 | Safe for synchronous processing (matches Lightspeed) |
| File types allowed | `.xlsx` only | No `.csv`, `.xls` in MVP |

---

## Industry Research Summary

Research into Square, Shopify, and Lightspeed confirmed three non-negotiable patterns:

1. **Dry-run first, commit second** — users see exactly what will happen before anything is saved
2. **Partial success, not all-or-nothing** — one bad row should not discard 499 good rows; use savepoints per row
3. **Atomic product + batch creation** — product and opening balance batch created together; if batch fails, product is rolled back too

For the FIFO batch problem during migration, the industry standard for MVP is a **single "Opening Balance" batch per product** with the import date as `purchase_date`. Future stock-ins append new batches that FIFO sequences correctly.

---

## Backend Implementation Scope

### New Dependency
- Install `exceljs` in `backend/package.json`

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/products/import/template` | Download the `.xlsx` template |
| `POST` | `/api/products/import/preview` | Validate only, no DB writes |
| `POST` | `/api/products/import/commit` | Full import with savepoint-per-row |

### Guards (all import endpoints)
```typescript
@UseGuards(AuthGuard('jwt'), TenantGuard, SubscriptionGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN)
@RequirePermissions(Permission.PRODUCTS_MANAGE)
```

Plan limit: checked **upfront** in preview (existing count + valid rows > plan limit → reject all before processing).

### New Files
- `backend/src/products/products-import.service.ts` — import logic (separate from main service)
- `backend/src/products/dto/import-result.dto.ts`
- `backend/src/products/dto/import-preview-result.dto.ts`

### Modified Files
- `backend/src/products/products.controller.ts` — 3 new endpoints
- `backend/src/products/products.module.ts` — register FileInterceptor + new service

---

## Frontend Implementation Scope

### UI Changes
- "Import" button added to Products page header (Admin only, beside "Add Product")
- New `product-import-dialog` sub-component in `features/products/`

### Import Dialog Steps
1. **Step 1** — Download template link (`GET /api/products/import/template`)
2. **Step 2** — File upload (drag-and-drop or file picker, `.xlsx` only, max 5 MB)
3. **Step 3** (auto-triggered after upload) — Preview results table:
   - Valid rows (green count)
   - Skipped rows (yellow — SKU exists)
   - Error rows (red table with row number + column + reason)
4. **Step 4** — "Confirm Import" button → commit → final summary toast
   - Error rows: frontend renders filtered rows as downloadable CSV for user to fix

### New Files
```
frontend/src/app/features/products/product-import-dialog/
  ├── product-import-dialog.ts
  ├── product-import-dialog.html
  └── product-import-dialog.scss
```

### Modified Files
- `frontend/src/app/features/products/product-list/product-list.ts` — Import button + dialog trigger
- `frontend/src/app/features/products/product-list/product-list.html` — Import button in header

---

## What Does NOT Change

- No DB migrations needed — existing `inventory_batches`, `stock_movements`, `products` tables absorb import data naturally
- FIFO sale deduction logic unaffected — opening balance batch treated identically to a manual stock-in
- All existing guards and permissions unchanged
- Subscription usage limits still enforced

---

## Verification Checklist

- [ ] **Dry-run test**: Upload file with 1 invalid row + 1 duplicate SKU + 3 valid rows → preview shows 3 valid, 1 skipped, 1 error; nothing saved to DB
- [ ] **Commit test**: After preview, click Confirm → 3 products created; verify opening balance batches exist in DB for products with `current_stock > 0`
- [ ] **FIFO integrity test**: POS sale of imported product → correct FIFO deduction from opening batch
- [ ] **Plan limit test**: 501-row file on Tindahan plan (limit 500) → full rejection with clear error message
- [ ] **Duplicate-safe test**: Import same file twice → second run: all rows skipped, no duplicates
- [ ] **Atomic safety test**: If batch creation fails, verify product is NOT left in DB with orphaned stock

---

## Future Enhancements (Post-MVP)

- Multi-batch import: Allow template to include multiple batch rows per product (with `purchase_date`, `batch_number` columns) for users with detailed purchase history from their old system
- Update mode: Optional "overwrite existing products" checkbox for price/name updates
- Async processing + progress bar for imports > 500 rows
- Email notification on completion for large imports
