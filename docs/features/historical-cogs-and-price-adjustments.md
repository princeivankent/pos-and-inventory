# Historical COGS and Price Adjustments

**Completed:** February 24, 2026  
**Status:** ✅ Complete

---

## Overview

This feature makes profit and stock valuation resilient to supplier price changes over time.

Implemented behavior:
- COGS for new sales is snapshotted per sold batch portion.
- Profit reports use FIFO historical cost snapshots first.
- Legacy rows without snapshots use runtime fallback costing and return warnings.
- Stock-in with `unit_cost` now updates `product.cost_price`.
- Inventory report stock value now uses active batch valuation (`current_quantity * unit_cost`).

---

## Database Changes

### Migration
**File:** `backend/src/database/migrations/1707700000000-AddSaleItemCostSnapshots.ts`

Adds nullable columns on `sale_items`:
- `unit_cost_snapshot DECIMAL(10,2)`
- `cogs_subtotal DECIMAL(10,2)`

No backfill is required for rollout. Legacy rows remain supported through fallback logic.

---

## Backend Behavior

### Sales Snapshot Write
**File:** `backend/src/sales/sales.service.ts`

When a sale line is allocated across FIFO batches, each saved `SaleItem` now stores:
- `unit_cost_snapshot` from the matched batch `unit_cost`
- `cogs_subtotal = unit_cost_snapshot * quantity`

This preserves historical cost even if product master cost changes later.

FIFO ordering detail:
- Batches are selected by `purchase_date ASC, created_at ASC` for deterministic same-day ordering.
- This prevents ambiguous batch selection when multiple stock-ins happen on the same date.

### Stock In Cost Sync
**File:** `backend/src/inventory/inventory.service.ts`

For `stock_in` adjustments:
- `effectiveUnitCost = dto.unit_cost ?? product.cost_price`
- Batch stores `unit_cost` and `wholesale_price` from `effectiveUnitCost`
- If `dto.unit_cost` is provided, `product.cost_price` is auto-updated
- `product.retail_price` is unchanged (manual pricing decision)

### Profit Report Costing
**File:** `backend/src/reports/reports.service.ts`

`GET /api/reports/profit` now computes cost with this priority:
1. `sale_items.cogs_subtotal` (snapshot)
2. `sale_items.quantity * inventory_batches.unit_cost` (legacy fallback when snapshot is null)
3. `sale_items.quantity * products.cost_price` (final fallback)

Response additions:
- `costing_method`
- `legacy_fallback_rows`
- `warnings[]`

Operational clarification:
- If an older active batch has a higher/lower cost, FIFO will consume that batch first.
- This can make current-day profit differ from the latest product cost or latest stock-in cost.

### Inventory Valuation
**File:** `backend/src/reports/reports.service.ts`

`GET /api/reports/inventory` stock valuation now uses active batches:
- Product stock value = sum of active batch `current_quantity * unit_cost` for that product
- Total stock value = sum of all product stock values

---

## Frontend Changes

### Profit Report Warning
**Files:**
- `frontend/src/app/core/models/report.model.ts`
- `frontend/src/app/features/reports/reports.html`
- `frontend/src/app/features/reports/reports.scss`

Profit tab now displays a warning banner when `legacy_fallback_rows > 0`, using backend `warnings[0]` when available.

### POS FIFO Source Indicator
**Files:**
- `backend/src/products/products.service.ts`
- `frontend/src/app/core/models/product.model.ts`
- `frontend/src/app/features/pos/components/cart-panel/cart-panel.ts`
- `frontend/src/app/features/pos/components/cart-panel/cart-panel.html`
- `frontend/src/app/features/pos/components/cart-panel/cart-panel.scss`

`GET /api/products` now includes optional FIFO preview fields from the oldest active batch:
- `next_fifo_unit_cost`
- `next_fifo_purchase_date`

POS cart now shows a single summary note when FIFO source cost differs from current product cost:
- `FIFO supplier cost basis applies to N item(s). Selling prices are unchanged.`

This keeps the cart clean while still clarifying why profit can differ from the latest updated product cost.

### POS Per-Item On-Demand Cost Tooltip

To identify exactly which product is using a different FIFO supplier cost, each affected cart line now has a small info icon tooltip.

Tooltip includes:
- selling price
- FIFO supplier cost used now
- current product cost
- source batch date
- expected unit gross

This balances precision and UI noise: details are available on demand, not always visible.

---

## Rollout Notes

- Safe deployment order: migration -> backend -> frontend.
- Legacy data remains reportable without blocking users.
- To fully remove fallback warnings for old periods, a separate backfill can be added later.
