# Philippine Tax & BIR Reference

Quick reference for Philippine financial regulations relevant to POS systems.

## VAT Rules

### Who Must Register for VAT
- Businesses with gross annual sales exceeding ₱3,000,000
- Businesses that voluntarily register

### VAT Rate
- Standard: 12%
- VAT-exempt: 0% (specific goods/services like agricultural products, educational services)

### VAT Computation

**VAT-Exclusive (tax added on top):**
```
Sale price: ₱1,000
VAT: ₱1,000 × 0.12 = ₱120
Total: ₱1,120
```

**VAT-Inclusive (tax already in the price):**
```
Total price: ₱1,120
VAT portion: ₱1,120 × (12/112) = ₱120
Net of VAT: ₱1,120 - ₱120 = ₱1,000
```

### VAT on Discounts
- If discount is given BEFORE the sale: VAT is computed on the discounted price
- If discount is given AFTER the sale (e.g., prompt payment): VAT was already computed on the original price

## Receipt Requirements (BIR)

### Official Receipt (OR) Must Include:
1. Business name and trade name
2. Business address
3. TIN (Tax Identification Number)
4. Date of transaction
5. Description of goods/services
6. Quantity and unit price
7. Amount of VAT (if VAT-registered)
8. Total amount
9. Sequential receipt number (no gaps)
10. BIR Permit to Print number

### Machine-Generated Receipts (POS)
- Must have BIR-approved POS permit (CAS - Computerized Accounting System)
- Must generate Z-reading (end of day summary)
- Must maintain transaction logs
- POS must have approved serial number visible on receipts

## Common Tax Rates

| Type | Rate | Notes |
|---|---|---|
| VAT | 12% | Standard rate for most goods/services |
| Withholding Tax (goods) | 1% | On purchases > ₱10,000 |
| Withholding Tax (services) | 2% | On services > ₱10,000 |
| Percentage Tax (non-VAT) | 3% | For businesses below VAT threshold |

## Senior Citizen / PWD Discounts

- 20% discount on medicines, food, and essential goods
- Computed on the original price, BEFORE adding VAT
- VAT-exempt (no VAT on senior citizen discounted transactions)
- Must be applied per line item, not on the total

```
Original price: ₱100
Senior discount: ₱100 × 0.20 = ₱20
Discounted price: ₱80
VAT: ₱0 (exempt)
Total: ₱80
```

## Record Keeping Requirements

- Sales records: **10 years** from date of transaction
- Books of accounts: **10 years** from the last entry
- Must be available for BIR inspection at any time
- Electronic records are acceptable if properly maintained

## Filing Deadlines

| Return | Frequency | Deadline |
|---|---|---|
| VAT Return (BIR Form 2550M) | Monthly | 20th of following month |
| VAT Return (BIR Form 2550Q) | Quarterly | 25th after quarter end |
| Income Tax (BIR Form 1701Q) | Quarterly | 15th after quarter end |
| Annual Income Tax | Annual | April 15 |

## Currency Rules

- Philippine Peso (PHP/₱)
- Always 2 decimal places for financial records
- Use standard rounding (half up) for tax calculations
- Minimum denomination: ₱0.01 (centavo)
