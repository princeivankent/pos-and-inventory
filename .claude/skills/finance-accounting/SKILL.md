---
name: finance-accounting
description: Provides brutally honest, expert-level accounting and finance guidance for FinTech applications. Use when building ANY financial feature — profit calculations, inventory costing, tax computations, credit/debt management, financial reports, payment processing, or audit trails. Catches common financial software bugs like rounding errors, wrong cost basis, and decimal precision issues. Also use when reviewing existing financial logic for correctness.
---

# Finance & Accounting Expert

Expert-level financial and accounting guidance for building reliable, auditable FinTech and financial applications. Catches bugs before they ship.

## Core Principle

**Money math is not regular math.** Financial software has zero tolerance for "close enough." A ₱0.01 rounding error across 10,000 transactions is ₱100 missing. Every calculation must be intentional, precise, and auditable.

## Critical Rules (Never Break These)

### 1. Decimal Precision

- **Store money as `decimal(10,2)` or higher precision** — NEVER use `float` or `double` for currency
- **Round only at the final step** — intermediate calculations should preserve full precision
- **Use banker's rounding (round half to even)** when required by regulation
- **Always use `Math.round(value * 100) / 100`** for 2-decimal rounding in JavaScript/TypeScript
- **Parse decimal strings explicitly** — database decimals come back as strings in many ORMs (TypeORM included)

```typescript
// WRONG - floating point errors
const tax = price * 0.12; // 100.10 * 0.12 = 12.011999999...

// RIGHT - round at the end
const tax = Math.round(price * 0.12 * 100) / 100;
```

### 2. Cost Basis Consistency

**The #1 source of profit calculation bugs.** Always be explicit about which cost you're using:

| Cost Source | When to Use | Watch Out For |
|---|---|---|
| `product.cost_price` | Simplified systems, current cost | Changes over time — historical profit recalculates |
| `batch.unit_cost` | FIFO/LIFO accounting, actual cost | Must match the exact batch sold |
| `sale_item.unit_cost` | Snapshot at time of sale | Must be recorded at sale time, never back-calculated |

**Best practice:** Record the cost on the `sale_item` at the moment of sale. This creates an immutable audit trail. Never rely on joining back to products or batches for historical cost — those values change.

**Red flag:** Any profit query that JOINs to a mutable table for cost data. If product.cost_price gets updated, all historical profit reports change retroactively.

### 3. Atomic Financial Transactions

**Every financial operation must be atomic.** If any step fails, ALL steps must roll back.

A sale transaction must atomically:
1. Validate stock availability
2. Validate credit limits (if credit sale)
3. Create the sale record
4. Create sale items with cost snapshots
5. Deduct inventory (FIFO batch selection)
6. Create stock movements
7. Update customer balance (if credit)

**Never** update financial state outside a transaction. **Never** assume a previous check is still valid inside a transaction without re-checking (TOCTOU race conditions).

### 4. Immutable Financial Records

- **Never UPDATE a completed sale** — create void/return records instead
- **Never DELETE financial records** — use status flags (void, cancelled, reversed)
- **Always maintain an audit trail** — who, what, when, why
- **Void operations must create inverse entries**, not delete originals

## Inventory Costing Methods

### FIFO (First In, First Out)

Used by this POS system. Oldest inventory is sold first.

```
Batch 1: 10 units @ ₱100 (purchased Jan 1)
Batch 2: 10 units @ ₱120 (purchased Feb 1)

Sale of 15 units:
  - 10 from Batch 1 @ ₱100 = ₱1,000
  - 5 from Batch 2 @ ₱120 = ₱600
  - Total COGS = ₱1,600
```

**FIFO implementation checklist:**
- Query batches ordered by `purchase_date ASC`
- Filter: `is_active = true AND current_quantity > 0`
- Deduct from oldest batch first, move to next when exhausted
- Create one sale_item per batch portion (not one per product)
- Record `batch_id` on each sale_item for traceability

**Common FIFO bugs:**
- Not ordering by purchase_date (random batch selection)
- Deducting from product.current_stock but not from batch.current_quantity
- Race condition: two concurrent sales select the same batch
- Not handling the case where a single line item spans multiple batches

### Weighted Average Cost

Alternative method. Not currently used but be aware of it:

```
Average cost = Total inventory value / Total units
```

Recalculates after every purchase. Simpler but less precise for tax reporting.

## Profit & Margin Calculations

### Gross Profit

```
Gross Profit = Revenue - Cost of Goods Sold (COGS)
```

**Revenue** = Sum of sale amounts (what the customer paid)
**COGS** = Sum of costs for the specific items sold

### Profit Margin vs Markup (Common Confusion)

```
Margin = (Revenue - Cost) / Revenue × 100
Markup = (Revenue - Cost) / Cost × 100
```

Example: Buy at ₱400, sell at ₱600
- Margin = 200/600 = 33.3%
- Markup = 200/400 = 50%

**These are NOT interchangeable.** Always clarify which one is being displayed.

### Net Profit

```
Net Profit = Gross Profit - Operating Expenses - Tax
```

A POS system typically reports gross profit. Net profit requires expense tracking.

## Tax Calculations (Philippine VAT)

### Standard VAT (12%)

```
// VAT-exclusive pricing (add tax on top)
subtotal = sum(item_prices)
vat = subtotal × 0.12
total = subtotal + vat

// VAT-inclusive pricing (tax already in price)
vat = total_amount × (12/112)
net_of_vat = total_amount - vat
```

**Know which model your system uses.** Mixing VAT-inclusive and VAT-exclusive pricing in the same system causes errors.

### BIR Compliance Essentials

- Store TIN (Tax Identification Number) must appear on all receipts
- Official receipts must have sequential numbering (no gaps)
- Sales records must be retained for 10 years
- VAT-registered businesses must file monthly and quarterly returns
- Minimum information on receipts: business name, TIN, address, date, items, VAT breakdown

### Tax Rounding Rule

Philippine BIR uses standard rounding (round half up) for tax amounts. Round tax to 2 decimal places.

## Credit Management (Utang/Receivables)

### Credit Sale Validation

Before allowing a credit sale:

```
available_credit = customer.credit_limit - customer.current_balance
if (sale_total > available_credit) → REJECT
```

**Always check inside the transaction** — another sale might be processing simultaneously.

### Payment Application

When a customer makes a payment against their balance:
1. Record the payment with timestamp and amount
2. Reduce customer.current_balance
3. Optionally apply to specific invoices (for aging reports)
4. Never delete the original credit sale record

### Aging Report Categories

Standard aging buckets:
- Current (0-30 days)
- 31-60 days
- 61-90 days
- Over 90 days

## Financial Report Validation Checklist

When building or reviewing any financial report, verify:

### Data Integrity
- [ ] Query filters by `store_id` (multi-tenant isolation)
- [ ] Only includes completed/valid transactions (excludes void, cancelled)
- [ ] Date range boundaries are inclusive and use proper timestamps
- [ ] Amounts are summed from the correct source (sale_item vs sale level)

### Calculation Accuracy
- [ ] Cost basis is consistent (product cost vs batch cost vs snapshot cost)
- [ ] Rounding is applied at the correct stage
- [ ] Discounts are subtracted before tax calculation
- [ ] Tax is calculated on the correct base amount
- [ ] Void/return transactions are properly excluded OR shown as negative

### Cross-Validation
- [ ] Total revenue matches sum of individual sale totals
- [ ] Profit = Revenue - Cost (verify the math adds up)
- [ ] Inventory value changes match stock movements
- [ ] Customer balance matches sum of credits minus payments

## Common Financial Software Bugs

### 1. The Retroactive Cost Bug
**Symptom:** Historical profit reports change when you update a product's cost_price
**Cause:** Profit query joins to product table for cost instead of using recorded cost
**Fix:** Snapshot cost_price on sale_item at time of sale

### 2. The Double-Count Bug
**Symptom:** Revenue is higher than actual sales
**Cause:** SQL JOIN produces duplicate rows when sale items span multiple batches
**Fix:** Ensure aggregation is at the correct level; use DISTINCT or sub-queries

### 3. The Rounding Accumulation Bug
**Symptom:** Line item totals don't add up to the invoice total
**Cause:** Rounding each line item then summing vs summing then rounding
**Fix:** Be consistent — either round per line (and accept the total may differ by pennies) or calculate total from raw values

### 4. The Timezone Bug
**Symptom:** "Today's sales" shows yesterday's evening sales or misses morning sales
**Cause:** Server timezone differs from business timezone
**Fix:** Always use the store's timezone for date-based reports, not UTC

### 5. The Void Recount Bug
**Symptom:** Voided sales still appear in revenue totals
**Cause:** Status filter missing in report query
**Fix:** Always filter `WHERE status = 'completed'` in financial aggregations

### 6. The Decimal String Bug
**Symptom:** Calculations produce NaN or concatenate instead of adding
**Cause:** TypeORM returns decimal columns as strings
**Fix:** Always `Number()` or `parseFloat()` before arithmetic, or use entity transformers

## Code Review Checklist for Financial Features

When reviewing or writing financial code, verify:

1. **Is money stored as decimal, not float?**
2. **Are all decimal values parsed from strings?** (TypeORM transformer or explicit conversion)
3. **Is the cost basis explicitly chosen and documented?**
4. **Are financial state changes wrapped in a transaction?**
5. **Is rounding applied only at the final step?**
6. **Are void/cancelled records excluded from totals?**
7. **Is the date range handling correct?** (inclusive, timezone-aware)
8. **Are concurrent access scenarios handled?** (optimistic locking, transaction isolation)
9. **Is there an audit trail?** (who changed what, when)
10. **Can financial records be retroactively modified?** (they shouldn't be)

## Query Patterns

### Safe Revenue Query
```sql
SELECT SUM(s.total_amount) as revenue
FROM sales s
WHERE s.store_id = :storeId
  AND s.sale_date BETWEEN :start AND :end
  AND s.status = 'completed'  -- Always filter status!
```

### Safe Profit Query
```sql
SELECT
  SUM(si.subtotal) as revenue,
  SUM(si.quantity * si.recorded_cost) as cogs,  -- Use snapshot cost!
  SUM(si.subtotal) - SUM(si.quantity * si.recorded_cost) as gross_profit
FROM sale_items si
INNER JOIN sales s ON s.id = si.sale_id
WHERE s.store_id = :storeId
  AND s.sale_date BETWEEN :start AND :end
  AND s.status = 'completed'
```

### Safe Inventory Value Query
```sql
SELECT
  SUM(ib.current_quantity * ib.unit_cost) as stock_value_at_cost,
  SUM(ib.current_quantity * p.retail_price) as stock_value_at_retail
FROM inventory_batches ib
INNER JOIN products p ON p.id = ib.product_id
WHERE ib.store_id = :storeId
  AND ib.is_active = true
  AND ib.current_quantity > 0
```

## When This Skill Activates

Use this skill when:
- Building or modifying any financial calculation (profit, cost, tax, margins)
- Creating or editing financial reports
- Working with inventory costing (FIFO, batch management)
- Implementing payment or credit features
- Building receipt or invoice generation
- Reviewing existing financial queries for correctness
- Debugging financial discrepancies ("the numbers don't add up")

## Output Expectations

When applying this skill:
1. **Identify the cost basis** being used and flag if it's inconsistent
2. **Verify rounding strategy** and flag precision issues
3. **Check for common bugs** from the list above
4. **Validate query correctness** — status filters, date ranges, JOIN logic
5. **Recommend improvements** — cost snapshots, audit trails, atomic transactions
6. **Show the math** — work through an example to prove the calculation is correct
