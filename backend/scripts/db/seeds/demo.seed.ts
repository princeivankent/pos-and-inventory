import { Client } from 'pg';

// ---------------------------------------------------------------------------
// Fixed UUIDs — idempotent (ON CONFLICT DO NOTHING)
// ---------------------------------------------------------------------------

// Suppliers
const S_SMC  = 'dd000001-0000-4000-8000-000000000001'; // San Miguel Corporation
const S_NEST = 'dd000001-0000-4000-8000-000000000002'; // Nestle Philippines
const S_URC  = 'dd000001-0000-4000-8000-000000000003'; // Universal Robina Corp

// Parent categories
const C_BEV  = 'dd000002-0000-4000-8000-000000000001'; // Beverages
const C_FOOD = 'dd000002-0000-4000-8000-000000000002'; // Food & Snacks

// Child categories
const C_SOFT = 'dd000002-0000-4000-8000-000000000011'; // Softdrinks
const C_NOOD = 'dd000002-0000-4000-8000-000000000012'; // Instant Noodles
const C_BISC = 'dd000002-0000-4000-8000-000000000013'; // Biscuits & Snacks

// Products  (p01 – p12)
const P = (n: number) => `dd000003-0000-4000-8000-${String(n).padStart(12, '0')}`;

// Inventory batches  (b01 – b12)
const B = (n: number) => `dd000004-0000-4000-8000-${String(n).padStart(12, '0')}`;

// Stock movements  (m01 – m12)
const M = (n: number) => `dd000005-0000-4000-8000-${String(n).padStart(12, '0')}`;

// ---------------------------------------------------------------------------
// Data definitions
// ---------------------------------------------------------------------------

const SUPPLIERS = [
  { id: S_SMC,  name: 'San Miguel Corporation',  phone: '02-8632-3000', email: 'trade@sanmiguel.com.ph',   address: 'San Miguel Ave, Mandaluyong City' },
  { id: S_NEST, name: 'Nestle Philippines',       phone: '02-8898-0700', email: 'ph.consumer@nestle.com',   address: 'Rockwell Drive, Makati City' },
  { id: S_URC,  name: 'Universal Robina Corp',   phone: '02-8633-7631', email: 'consumer@urc.com.ph',      address: 'URC Bldg, E. Rodriguez Ave, Quezon City' },
];

const PARENT_CATEGORIES = [
  { id: C_BEV,  name: 'Beverages',    description: 'Drinks and beverage products' },
  { id: C_FOOD, name: 'Food & Snacks', description: 'Food items, snacks, and instant meals' },
];

const CHILD_CATEGORIES = [
  { id: C_SOFT, parent_id: C_BEV,  name: 'Softdrinks',       description: 'Carbonated and non-carbonated drinks' },
  { id: C_NOOD, parent_id: C_FOOD, name: 'Instant Noodles',  description: 'Instant noodle products' },
  { id: C_BISC, parent_id: C_FOOD, name: 'Biscuits & Snacks', description: 'Crackers, chips, and biscuit products' },
];

interface ProductDef {
  id: string;
  batchId: string;
  movementId: string;
  categoryId: string;
  supplierId: string;
  sku: string;
  name: string;
  unit: string;
  retailPrice: number;
  costPrice: number;
  reorderLevel: number;
  batchQty: number;
  batchNo: string;
  purchaseDate: string; // YYYY-MM-DD
}

const PRODUCTS: ProductDef[] = [
  // ── Softdrinks ──────────────────────────────────────────────────────────
  {
    id: P(1),  batchId: B(1),  movementId: M(1),
    categoryId: C_SOFT, supplierId: S_SMC,
    sku: 'BEV-CCA-15L', name: 'Coca-Cola 1.5L',
    unit: 'btl', retailPrice: 62, costPrice: 45, reorderLevel: 20,
    batchQty: 100, batchNo: 'SMC-001', purchaseDate: '2026-03-01',
  },
  {
    id: P(2),  batchId: B(2),  movementId: M(2),
    categoryId: C_SOFT, supplierId: S_SMC,
    sku: 'BEV-SPR-15L', name: 'Sprite 1.5L',
    unit: 'btl', retailPrice: 60, costPrice: 43, reorderLevel: 20,
    batchQty: 80, batchNo: 'SMC-002', purchaseDate: '2026-03-01',
  },
  {
    id: P(3),  batchId: B(3),  movementId: M(3),
    categoryId: C_SOFT, supplierId: S_SMC,
    sku: 'BEV-RTO-1L', name: 'Royal Tru-Orange 1L',
    unit: 'btl', retailPrice: 48, costPrice: 35, reorderLevel: 15,
    batchQty: 80, batchNo: 'SMC-003', purchaseDate: '2026-03-01',
  },
  {
    id: P(4),  batchId: B(4),  movementId: M(4),
    categoryId: C_SOFT, supplierId: S_URC,
    sku: 'BEV-C2G-350', name: 'C2 Green Tea 350ml',
    unit: 'btl', retailPrice: 25, costPrice: 18, reorderLevel: 30,
    batchQty: 150, batchNo: 'URC-001', purchaseDate: '2026-03-02',
  },
  // ── Instant Noodles ─────────────────────────────────────────────────────
  {
    id: P(5),  batchId: B(5),  movementId: M(5),
    categoryId: C_NOOD, supplierId: S_NEST,
    sku: 'NOO-LMC-55G', name: 'Lucky Me! Chicken Sopas 55g',
    unit: 'pcs', retailPrice: 13, costPrice: 9, reorderLevel: 50,
    batchQty: 200, batchNo: 'NST-001', purchaseDate: '2026-03-02',
  },
  {
    id: P(6),  batchId: B(6),  movementId: M(6),
    categoryId: C_NOOD, supplierId: S_NEST,
    sku: 'NOO-LMP-65G', name: 'Lucky Me! Pancit Canton 65g',
    unit: 'pcs', retailPrice: 13, costPrice: 9, reorderLevel: 50,
    batchQty: 200, batchNo: 'NST-002', purchaseDate: '2026-03-02',
  },
  {
    id: P(7),  batchId: B(7),  movementId: M(7),
    categoryId: C_NOOD, supplierId: S_NEST,
    sku: 'NOO-LMB-55G', name: 'Lucky Me! Beef Noodle Soup 55g',
    unit: 'pcs', retailPrice: 13, costPrice: 9, reorderLevel: 50,
    batchQty: 200, batchNo: 'NST-003', purchaseDate: '2026-03-02',
  },
  {
    id: P(8),  batchId: B(8),  movementId: M(8),
    categoryId: C_NOOD, supplierId: S_URC,
    sku: 'NOO-NIS-40G', name: 'Nissin Cup Noodles Seafood 40g',
    unit: 'pcs', retailPrice: 28, costPrice: 20, reorderLevel: 30,
    batchQty: 100, batchNo: 'URC-002', purchaseDate: '2026-03-03',
  },
  // ── Biscuits & Snacks ────────────────────────────────────────────────────
  {
    id: P(9),  batchId: B(9),  movementId: M(9),
    categoryId: C_BISC, supplierId: S_URC,
    sku: 'SNK-SKY-33G', name: 'Skyflakes Crackers 33g',
    unit: 'pcs', retailPrice: 10, costPrice: 7, reorderLevel: 50,
    batchQty: 150, batchNo: 'URC-003', purchaseDate: '2026-03-03',
  },
  {
    id: P(10), batchId: B(10), movementId: M(10),
    categoryId: C_BISC, supplierId: S_URC,
    sku: 'SNK-REB-33G', name: 'Rebisco Chocolate Sandwich 33g',
    unit: 'pcs', retailPrice: 10, costPrice: 7, reorderLevel: 50,
    batchQty: 150, batchNo: 'URC-004', purchaseDate: '2026-03-03',
  },
  {
    id: P(11), batchId: B(11), movementId: M(11),
    categoryId: C_BISC, supplierId: S_URC,
    sku: 'SNK-PIA-85G', name: 'Piattos Sour Cream 85g',
    unit: 'pcs', retailPrice: 42, costPrice: 30, reorderLevel: 20,
    batchQty: 80, batchNo: 'URC-005', purchaseDate: '2026-03-04',
  },
  {
    id: P(12), batchId: B(12), movementId: M(12),
    categoryId: C_BISC, supplierId: S_URC,
    sku: 'SNK-JJP-60G', name: "Jack 'n Jill Potato Chips 60g",
    unit: 'pcs', retailPrice: 30, costPrice: 22, reorderLevel: 20,
    batchQty: 100, batchNo: 'URC-006', purchaseDate: '2026-03-04',
  },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

export async function seedDemoData(client: Client, storeId: string) {
  console.log(`\nSeeding demo data for store: ${storeId}\n`);

  // ── Purge existing store data (FK-safe order) ──────────────────────────
  console.log('Purging existing store data...');

  // sale_items has no store_id — delete via parent sales
  await client.query(
    `DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE store_id = $1)`,
    [storeId],
  );

  const purgeTables = [
    'credit_payments',
    'sales',
    'stock_movements',
    'low_stock_alerts',
    'inventory_batches',
    'products',
    'categories',
    'customers',
    'suppliers',
  ];

  for (const table of purgeTables) {
    const res = await client.query(`DELETE FROM ${table} WHERE store_id = $1`, [storeId]);
    const count = res.rowCount ?? 0;
    if (Number(count) > 0) console.log(`  Cleared ${count} rows from ${table}`);
  }

  console.log('Purge complete. Inserting demo data...\n');

  // ── Suppliers ──────────────────────────────────────────────────────────
  for (const s of SUPPLIERS) {
    await client.query(
      `INSERT INTO suppliers (id, store_id, name, phone, email, address, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (id) DO NOTHING`,
      [s.id, storeId, s.name, s.phone, s.email, s.address],
    );
  }
  console.log(`  ✓ Suppliers: ${SUPPLIERS.length}`);

  // ── Parent categories ──────────────────────────────────────────────────
  for (const c of PARENT_CATEGORIES) {
    await client.query(
      `INSERT INTO categories (id, store_id, name, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [c.id, storeId, c.name, c.description],
    );
  }
  console.log(`  ✓ Parent categories: ${PARENT_CATEGORIES.length}`);

  // ── Child categories ───────────────────────────────────────────────────
  for (const c of CHILD_CATEGORIES) {
    await client.query(
      `INSERT INTO categories (id, store_id, name, description, parent_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [c.id, storeId, c.name, c.description, c.parent_id],
    );
  }
  console.log(`  ✓ Child categories: ${CHILD_CATEGORIES.length}`);

  // ── Resolve admin user for stock movements ─────────────────────────────
  const userResult = await client.query<{ user_id: string }>(
    `SELECT user_id FROM user_stores WHERE store_id = $1 AND role = 'admin' LIMIT 1`,
    [storeId],
  );
  if (userResult.rows.length === 0) {
    throw new Error(`No admin user found for store ${storeId}. Add a user first.`);
  }
  const adminUserId = userResult.rows[0].user_id;
  console.log(`  ✓ Admin user resolved: ${adminUserId}`);

  // ── Products, batches, and stock movements ─────────────────────────────
  for (const p of PRODUCTS) {
    // Product
    await client.query(
      `INSERT INTO products
         (id, store_id, category_id, sku, name, unit, retail_price, cost_price,
          current_stock, reorder_level, has_expiry, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,true)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, storeId, p.categoryId, p.sku, p.name, p.unit,
       p.retailPrice, p.costPrice, p.batchQty, p.reorderLevel],
    );

    // Inventory batch
    await client.query(
      `INSERT INTO inventory_batches
         (id, store_id, product_id, supplier_id, batch_number, purchase_date,
          unit_cost, initial_quantity, current_quantity,
          wholesale_price, retail_price, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)
       ON CONFLICT (id) DO NOTHING`,
      [p.batchId, storeId, p.id, p.supplierId, p.batchNo, p.purchaseDate,
       p.costPrice, p.batchQty, p.batchQty,
       p.costPrice, p.retailPrice],
    );

    // Stock movement (PURCHASE)
    await client.query(
      `INSERT INTO stock_movements
         (id, store_id, batch_id, movement_type, quantity, reference_type, notes, created_by)
       VALUES ($1,$2,$3,'purchase',$4,'batch','Demo seed: initial stock',$5)
       ON CONFLICT (id) DO NOTHING`,
      [p.movementId, storeId, p.batchId, p.batchQty, adminUserId],
    );
  }
  console.log(`  ✓ Products: ${PRODUCTS.length}`);
  console.log(`  ✓ Inventory batches: ${PRODUCTS.length}`);
  console.log(`  ✓ Stock movements: ${PRODUCTS.length}`);
}
