import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1707000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create stores table
    await queryRunner.query(`
      CREATE TABLE stores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        tax_id VARCHAR(50),
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create user_stores table
    await queryRunner.query(`
      CREATE TYPE user_role AS ENUM ('admin', 'cashier');

      CREATE TABLE user_stores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        role user_role DEFAULT 'cashier',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, store_id)
      );

      CREATE INDEX idx_user_stores_user_id ON user_stores(user_id);
      CREATE INDEX idx_user_stores_store_id ON user_stores(store_id);
    `);

    // Create categories table
    await queryRunner.query(`
      CREATE TABLE categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_categories_store_id ON categories(store_id);
      CREATE INDEX idx_categories_store_name ON categories(store_id, name);
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        sku VARCHAR(100) NOT NULL,
        barcode VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        unit VARCHAR(50) DEFAULT 'pcs',
        reorder_level INTEGER DEFAULT 0,
        has_expiry BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_products_store_id ON products(store_id);
      CREATE INDEX idx_products_store_sku ON products(store_id, sku);
      CREATE INDEX idx_products_store_barcode ON products(store_id, barcode);
      CREATE INDEX idx_products_store_active ON products(store_id, is_active);
    `);

    // Create suppliers table
    await queryRunner.query(`
      CREATE TABLE suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_suppliers_store_id ON suppliers(store_id);
      CREATE INDEX idx_suppliers_store_name ON suppliers(store_id, name);
    `);

    // Create inventory_batches table
    await queryRunner.query(`
      CREATE TABLE inventory_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
        batch_number VARCHAR(100) NOT NULL,
        purchase_date DATE NOT NULL,
        expiry_date DATE,
        unit_cost DECIMAL(10, 2) NOT NULL,
        initial_quantity INTEGER NOT NULL,
        current_quantity INTEGER NOT NULL,
        wholesale_price DECIMAL(10, 2) NOT NULL,
        retail_price DECIMAL(10, 2) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_inventory_batches_store_id ON inventory_batches(store_id);
      CREATE INDEX idx_inventory_batches_store_product ON inventory_batches(store_id, product_id, is_active);
      CREATE INDEX idx_inventory_batches_store_batch ON inventory_batches(store_id, batch_number);
    `);

    // Create customers table
    await queryRunner.query(`
      CREATE TABLE customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        address TEXT,
        credit_limit DECIMAL(10, 2) DEFAULT 0,
        current_balance DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_customers_store_id ON customers(store_id);
      CREATE INDEX idx_customers_store_name ON customers(store_id, name);
      CREATE INDEX idx_customers_store_phone ON customers(store_id, phone);
    `);

    // Create sales table
    await queryRunner.query(`
      CREATE TYPE payment_method AS ENUM ('cash', 'credit', 'partial');
      CREATE TYPE sale_status AS ENUM ('completed', 'void', 'returned');

      CREATE TABLE sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        sale_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        sale_date TIMESTAMP NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method payment_method DEFAULT 'cash',
        amount_paid DECIMAL(10, 2) DEFAULT 0,
        change_amount DECIMAL(10, 2) DEFAULT 0,
        credit_amount DECIMAL(10, 2) DEFAULT 0,
        notes TEXT,
        status sale_status DEFAULT 'completed',
        returned_from_sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_sales_store_id ON sales(store_id);
      CREATE INDEX idx_sales_store_date ON sales(store_id, sale_date);
      CREATE INDEX idx_sales_store_customer ON sales(store_id, customer_id);
      CREATE INDEX idx_sales_store_number ON sales(store_id, sale_number);
    `);

    // Create sale_items table
    await queryRunner.query(`
      CREATE TABLE sale_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        batch_id UUID NOT NULL REFERENCES inventory_batches(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
    `);

    // Create credit_payments table
    await queryRunner.query(`
      CREATE TABLE credit_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
        payment_date TIMESTAMP NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cash',
        notes TEXT,
        recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_credit_payments_store_id ON credit_payments(store_id);
      CREATE INDEX idx_credit_payments_store_customer ON credit_payments(store_id, customer_id);
      CREATE INDEX idx_credit_payments_store_date ON credit_payments(store_id, payment_date);
    `);

    // Create stock_movements table
    await queryRunner.query(`
      CREATE TYPE movement_type AS ENUM ('purchase', 'sale', 'adjustment', 'return', 'expired', 'damaged');

      CREATE TABLE stock_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        batch_id UUID NOT NULL REFERENCES inventory_batches(id) ON DELETE CASCADE,
        movement_type movement_type NOT NULL,
        quantity INTEGER NOT NULL,
        reference_id UUID,
        reference_type VARCHAR(100),
        notes TEXT,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_stock_movements_store_id ON stock_movements(store_id);
      CREATE INDEX idx_stock_movements_store_batch ON stock_movements(store_id, batch_id);
      CREATE INDEX idx_stock_movements_store_created ON stock_movements(store_id, created_at);
    `);

    // Create low_stock_alerts table
    await queryRunner.query(`
      CREATE TYPE alert_type AS ENUM ('low_stock', 'out_of_stock', 'near_expiry', 'expired');

      CREATE TABLE low_stock_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        alert_type alert_type NOT NULL,
        alert_date TIMESTAMP NOT NULL,
        is_resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP,
        resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_low_stock_alerts_store_id ON low_stock_alerts(store_id);
      CREATE INDEX idx_low_stock_alerts_store_resolved ON low_stock_alerts(store_id, is_resolved);
      CREATE INDEX idx_low_stock_alerts_store_date ON low_stock_alerts(store_id, alert_date);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS low_stock_alerts CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS stock_movements CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS credit_payments CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS sale_items CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS sales CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS customers CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS inventory_batches CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS suppliers CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS products CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_stores CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS stores CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS alert_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS movement_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS sale_status;`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_method;`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role;`);
  }
}
