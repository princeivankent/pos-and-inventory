# POS & Inventory System - User Guide

## Getting Started

### 1. Register & Login
- Open the app and click **Register** to create your account.
- Your default store is created automatically during registration.
- Log in with your email and password to access the dashboard.

### 2. Dashboard
After login, you'll see the dashboard with today's sales summary and low stock alerts.

---

## Daily Operations

### Point of Sale (POS)
1. Go to **POS** from the sidebar.
2. Search for products by name, SKU, or barcode.
3. Tap a product or use the search bar to add it to the cart.
4. Adjust quantities directly in the cart.
5. Apply discounts (percentage or fixed amount) if needed.
6. Click **Checkout** and select the payment method (cash, credit/utang, or partial).
7. For cash payments, enter the amount tendered to see the change.
8. Complete the sale to generate a receipt.

### Viewing Sales
- Go to **Sales** to see all transactions.
- Click a sale to view its full details and receipt.
- Use the daily filter to view sales for a specific date.
- Admins can **void** a sale, which automatically restores the stock.

### Printing Receipts
- After completing a sale, a receipt preview is shown.
- Click **Print** to open the browser print dialog from the receipt preview.
- PDF receipt data is available via backend receipt endpoints.
- Receipts include store info, TIN, itemized totals, and VAT breakdown.

---

## Inventory Management

### Adding Stock
1. Go to **Inventory** from the sidebar.
2. Click **Stock In** and select the product.
3. Enter the quantity, optional unit cost, and notes.
4. Each stock-in creates a batch for FIFO tracking.
5. If you provide a unit cost, the product's cost price is automatically updated to that latest purchase cost.

### Stock Adjustments
- Use **Stock Out** for manual deductions (damages, losses).
- All movements are recorded in the **Movement History** page.

### Low Stock Alerts
- The **Low Stock** page shows products below their reorder level.
- Check this regularly to know when to restock.

---

## Product & Category Management (Admin)

### Products
- Go to **Products** to view, add, edit, or deactivate products.
- Each product has a name, SKU, barcode, retail price, cost price, and category.
- Deactivating a product hides it from the POS without deleting data.

### Categories
- Go to **Categories** to organize products.
- Categories support hierarchy (parent-child) for better organization.
- Example: Electronics > Accessories > Cables.

---

## Reports (Admin Only)

Access **Reports** from the sidebar to view:
- **Sales Summary** - Daily, weekly, or monthly sales totals.
- **Best-Selling Products** - Top products by quantity sold.
- **Profit Report** - Revenue vs cost breakdown.
- **Inventory Report** - Current stock levels and valuations.

### Profit and Costing Notes
- Profit uses historical FIFO batch cost for new sales (based on batch allocations at sale time).
- Older records without historical snapshots may use fallback costing and show a warning in the Profit tab.
- Keep selling price decisions deliberate: retail price is not auto-changed when supplier cost changes.

---

## User Management (Admin Only)

- Go to **Users** to manage staff accounts.
- **Add User** creates a new account and assigns them to your store.
- Assign roles:
  - **Admin** - Full access to all features including reports, settings, and user management.
  - **Cashier** - Access to POS, sales viewing, and inventory.
- Deactivate users who no longer need access.

---

## Store Settings (Admin Only)

Go to **Settings** to configure:
- **Tax Settings** - Enable/disable VAT and set the tax rate (default 12%).
- **Receipt Header** - Custom text printed at the top of receipts (store name, address).
- **Receipt Footer** - Custom text at the bottom (thank you message, return policy).

---

## Multi-Store Support

- A single account can access multiple stores.
- Use the **store switcher** in the header to switch between stores.
- Your role (Admin/Cashier) can be different per store.
- All data (products, sales, inventory) is completely isolated per store.

---

## Quick Tips

- Use **barcode scanning** for faster product lookup at the POS.
- Check **Low Stock Alerts** at the start of each day.
- Review the **Daily Sales** report before closing the register.
- Keep product cost prices updated for accurate profit reports.
- Use stock-in unit cost when supplier prices change to keep valuation and profit analytics accurate.
- VAT is automatically calculated based on your store's tax settings.
