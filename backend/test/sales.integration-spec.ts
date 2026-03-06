import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SalesService } from '../src/sales/sales.service';
import { Sale, SaleStatus } from '../src/database/entities/sale.entity';
import { SaleItem } from '../src/database/entities/sale-item.entity';
import { Product } from '../src/database/entities/product.entity';
import { InventoryBatch } from '../src/database/entities/inventory-batch.entity';
import {
  StockMovement,
  MovementType,
} from '../src/database/entities/stock-movement.entity';
import { Store } from '../src/database/entities/store.entity';
import { Category } from '../src/database/entities/category.entity';
import { User } from '../src/database/entities/user.entity';
import { Customer } from '../src/database/entities/customer.entity';
import { Supplier } from '../src/database/entities/supplier.entity';
import { Organization } from '../src/database/entities/organization.entity';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const describeIfDb = TEST_DATABASE_URL ? describe : describe.skip;

describeIfDb('SalesService (integration, postgres)', () => {
  let dataSource: DataSource;
  let salesService: SalesService;
  let schemaName: string;

  const entities = [
    Sale,
    SaleItem,
    Product,
    InventoryBatch,
    StockMovement,
    Store,
    Category,
    User,
    Customer,
    Supplier,
    Organization,
  ];

  const createSchema = async (url: string, schema: string) => {
    const admin = new DataSource({
      type: 'postgres',
      url,
      synchronize: false,
      logging: false,
    });
    await admin.initialize();
    await admin.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await admin.destroy();
  };

  const dropSchema = async (url: string, schema: string) => {
    const admin = new DataSource({
      type: 'postgres',
      url,
      synchronize: false,
      logging: false,
    });
    await admin.initialize();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.destroy();
  };

  beforeAll(async () => {
    schemaName = `it_sales_${Date.now()}`;
    await createSchema(TEST_DATABASE_URL!, schemaName);

    dataSource = new DataSource({
      type: 'postgres',
      url: TEST_DATABASE_URL!,
      schema: schemaName,
      entities,
      synchronize: true,
      dropSchema: false,
      logging: false,
    });
    await dataSource.initialize();

    salesService = new SalesService(
      dataSource.getRepository(Sale),
      dataSource.getRepository(SaleItem),
      dataSource.getRepository(Product),
      dataSource.getRepository(InventoryBatch),
      dataSource.getRepository(StockMovement),
      dataSource.getRepository(Store),
      dataSource,
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    await dropSchema(TEST_DATABASE_URL!, schemaName);
  });

  beforeEach(async () => {
    for (const entity of [
      StockMovement,
      SaleItem,
      Sale,
      InventoryBatch,
      Product,
      Category,
      User,
      Customer,
      Supplier,
      Store,
      Organization,
    ]) {
      await dataSource.getRepository(entity).clear();
    }
  });

  it('allocates sold quantity via FIFO batches and updates stock records', async () => {
    const storeRepo = dataSource.getRepository(Store);
    const categoryRepo = dataSource.getRepository(Category);
    const userRepo = dataSource.getRepository(User);
    const productRepo = dataSource.getRepository(Product);
    const batchRepo = dataSource.getRepository(InventoryBatch);

    const store = await storeRepo.save({
      id: '10000000-0000-4000-8000-000000000001',
      name: 'Store 1',
      settings: { tax_enabled: false },
    });

    await categoryRepo.save({
      id: '20000000-0000-4000-8000-000000000001',
      store_id: store.id,
      name: 'General',
    });

    const cashier = await userRepo.save({
      id: '30000000-0000-4000-8000-000000000001',
      email: 'cashier@example.com',
      full_name: 'Cashier',
      is_active: true,
    });

    const product = await productRepo.save({
      id: '40000000-0000-4000-8000-000000000001',
      store_id: store.id,
      category_id: '20000000-0000-4000-8000-000000000001',
      sku: 'SKU-1',
      name: 'Milk',
      unit: 'pcs',
      retail_price: 100,
      cost_price: 50,
      current_stock: 12,
      is_active: true,
    });

    await batchRepo.save([
      {
        id: '50000000-0000-4000-8000-000000000001',
        store_id: store.id,
        product_id: product.id,
        batch_number: 'B1',
        purchase_date: new Date('2026-01-01'),
        unit_cost: 45,
        initial_quantity: 5,
        current_quantity: 5,
        wholesale_price: 90,
        retail_price: 100,
        is_active: true,
      },
      {
        id: '50000000-0000-4000-8000-000000000002',
        store_id: store.id,
        product_id: product.id,
        batch_number: 'B2',
        purchase_date: new Date('2026-01-10'),
        unit_cost: 47,
        initial_quantity: 7,
        current_quantity: 7,
        wholesale_price: 92,
        retail_price: 100,
        is_active: true,
      },
    ]);

    const sale = await salesService.create(
      {
        items: [{ product_id: product.id, quantity: 6, unit_price: 100 }],
        amount_paid: 700,
      } as any,
      store.id,
      cashier.id,
    );

    const updatedProduct = await productRepo.findOneByOrFail({ id: product.id });
    const batch1 = await batchRepo.findOneByOrFail({
      id: '50000000-0000-4000-8000-000000000001',
    });
    const batch2 = await batchRepo.findOneByOrFail({
      id: '50000000-0000-4000-8000-000000000002',
    });
    const saleItems = await dataSource.getRepository(SaleItem).find({
      where: { sale_id: sale.id },
      order: { created_at: 'ASC' },
    });

    expect(updatedProduct.current_stock).toBe(6);
    expect(batch1.current_quantity).toBe(0);
    expect(batch1.is_active).toBe(false);
    expect(batch2.current_quantity).toBe(6);
    expect(saleItems).toHaveLength(2);
    expect(saleItems[0].batch_id).toBe('50000000-0000-4000-8000-000000000001');
    expect(saleItems[0].quantity).toBe(5);
    expect(saleItems[1].batch_id).toBe('50000000-0000-4000-8000-000000000002');
    expect(saleItems[1].quantity).toBe(1);
  });

  it('enforces tenant isolation by rejecting product from a different store', async () => {
    const storeRepo = dataSource.getRepository(Store);
    const categoryRepo = dataSource.getRepository(Category);
    const userRepo = dataSource.getRepository(User);
    const productRepo = dataSource.getRepository(Product);

    const storeA = await storeRepo.save({
      id: '10000000-0000-4000-8000-000000000011',
      name: 'Store A',
      settings: { tax_enabled: false },
    });
    const storeB = await storeRepo.save({
      id: '10000000-0000-4000-8000-000000000012',
      name: 'Store B',
      settings: { tax_enabled: false },
    });

    await categoryRepo.save({
      id: '20000000-0000-4000-8000-000000000011',
      store_id: storeA.id,
      name: 'Cat A',
    });

    const cashier = await userRepo.save({
      id: '30000000-0000-4000-8000-000000000011',
      email: 'cashier-a@example.com',
      full_name: 'Cashier A',
      is_active: true,
    });

    const productInStoreA = await productRepo.save({
      id: '40000000-0000-4000-8000-000000000011',
      store_id: storeA.id,
      category_id: '20000000-0000-4000-8000-000000000011',
      sku: 'SKU-A',
      name: 'Rice',
      unit: 'pcs',
      retail_price: 80,
      cost_price: 50,
      current_stock: 10,
      is_active: true,
    });

    await expect(
      salesService.create(
        {
          items: [{ product_id: productInStoreA.id, quantity: 1, unit_price: 80 }],
          amount_paid: 100,
        } as any,
        storeB.id,
        cashier.id,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('voidSale restores product stock, batch quantities, and customer credit balance', async () => {
    const storeRepo = dataSource.getRepository(Store);
    const categoryRepo = dataSource.getRepository(Category);
    const userRepo = dataSource.getRepository(User);
    const productRepo = dataSource.getRepository(Product);
    const batchRepo = dataSource.getRepository(InventoryBatch);
    const customerRepo = dataSource.getRepository(Customer);
    const movementRepo = dataSource.getRepository(StockMovement);

    const store = await storeRepo.save({
      id: '10000000-0000-4000-8000-000000000021',
      name: 'Credit Store',
      settings: { tax_enabled: false },
    });

    await categoryRepo.save({
      id: '20000000-0000-4000-8000-000000000021',
      store_id: store.id,
      name: 'General',
    });

    const admin = await userRepo.save({
      id: '30000000-0000-4000-8000-000000000021',
      email: 'admin-credit@example.com',
      full_name: 'Admin Credit',
      is_active: true,
    });

    const customer = await customerRepo.save({
      id: '60000000-0000-4000-8000-000000000021',
      store_id: store.id,
      name: 'Juan Dela Cruz',
      phone: '09170000021',
      credit_limit: 500,
      current_balance: 100,
      is_active: true,
    });

    const product = await productRepo.save({
      id: '40000000-0000-4000-8000-000000000021',
      store_id: store.id,
      category_id: '20000000-0000-4000-8000-000000000021',
      sku: 'SKU-CREDIT',
      name: 'Coffee',
      unit: 'pcs',
      retail_price: 50,
      cost_price: 30,
      current_stock: 10,
      is_active: true,
    });

    await batchRepo.save({
      id: '50000000-0000-4000-8000-000000000021',
      store_id: store.id,
      product_id: product.id,
      batch_number: 'BCREDIT',
      purchase_date: new Date('2026-02-01'),
      unit_cost: 30,
      initial_quantity: 10,
      current_quantity: 10,
      wholesale_price: 40,
      retail_price: 50,
      is_active: true,
    });

    const sale = await salesService.create(
      {
        customer_id: customer.id,
        payment_method: 'credit',
        amount_paid: 0,
        credit_amount: 100,
        items: [{ product_id: product.id, quantity: 2, unit_price: 50 }],
      } as any,
      store.id,
      admin.id,
    );

    const afterSaleCustomer = await customerRepo.findOneByOrFail({ id: customer.id });
    expect(Number(afterSaleCustomer.current_balance)).toBe(200);

    const voidedSale = await salesService.voidSale(sale.id, store.id, admin.id);

    const updatedProduct = await productRepo.findOneByOrFail({ id: product.id });
    const updatedBatch = await batchRepo.findOneByOrFail({
      id: '50000000-0000-4000-8000-000000000021',
    });
    const updatedCustomer = await customerRepo.findOneByOrFail({ id: customer.id });
    const returnMovements = await movementRepo.find({
      where: { reference_id: sale.id, reference_type: 'void' },
    });

    expect(voidedSale.status).toBe(SaleStatus.VOID);
    expect(updatedProduct.current_stock).toBe(10);
    expect(updatedBatch.current_quantity).toBe(10);
    expect(updatedBatch.is_active).toBe(true);
    expect(Number(updatedCustomer.current_balance)).toBe(100);
    expect(returnMovements).toHaveLength(1);
    expect(returnMovements[0].movement_type).toBe(MovementType.RETURN);
    expect(Number(returnMovements[0].quantity)).toBe(2);
  });

  it('voidSale clamps reversed credit balance at zero', async () => {
    const storeRepo = dataSource.getRepository(Store);
    const categoryRepo = dataSource.getRepository(Category);
    const userRepo = dataSource.getRepository(User);
    const productRepo = dataSource.getRepository(Product);
    const batchRepo = dataSource.getRepository(InventoryBatch);
    const customerRepo = dataSource.getRepository(Customer);

    const store = await storeRepo.save({
      id: '10000000-0000-4000-8000-000000000022',
      name: 'Clamp Store',
      settings: { tax_enabled: false },
    });

    await categoryRepo.save({
      id: '20000000-0000-4000-8000-000000000022',
      store_id: store.id,
      name: 'General',
    });

    const admin = await userRepo.save({
      id: '30000000-0000-4000-8000-000000000022',
      email: 'admin-clamp@example.com',
      full_name: 'Admin Clamp',
      is_active: true,
    });

    const customer = await customerRepo.save({
      id: '60000000-0000-4000-8000-000000000022',
      store_id: store.id,
      name: 'Clamp Customer',
      phone: '09170000022',
      credit_limit: 500,
      current_balance: 0,
      is_active: true,
    });

    const product = await productRepo.save({
      id: '40000000-0000-4000-8000-000000000022',
      store_id: store.id,
      category_id: '20000000-0000-4000-8000-000000000022',
      sku: 'SKU-CLAMP',
      name: 'Bread',
      unit: 'pcs',
      retail_price: 25,
      cost_price: 10,
      current_stock: 4,
      is_active: true,
    });

    await batchRepo.save({
      id: '50000000-0000-4000-8000-000000000022',
      store_id: store.id,
      product_id: product.id,
      batch_number: 'BCLAMP',
      purchase_date: new Date('2026-02-02'),
      unit_cost: 10,
      initial_quantity: 4,
      current_quantity: 4,
      wholesale_price: 15,
      retail_price: 25,
      is_active: true,
    });

    const sale = await salesService.create(
      {
        customer_id: customer.id,
        payment_method: 'partial',
        amount_paid: 40,
        credit_amount: 10,
        items: [{ product_id: product.id, quantity: 2, unit_price: 25 }],
      } as any,
      store.id,
      admin.id,
    );

    await dataSource.getRepository(Customer).update(customer.id, {
      current_balance: 5,
    });

    await salesService.voidSale(sale.id, store.id, admin.id);

    const updatedCustomer = await customerRepo.findOneByOrFail({ id: customer.id });
    expect(Number(updatedCustomer.current_balance)).toBe(0);
  });

  it('rolls back sale creation when FIFO batches do not cover requested quantity', async () => {
    const storeRepo = dataSource.getRepository(Store);
    const categoryRepo = dataSource.getRepository(Category);
    const userRepo = dataSource.getRepository(User);
    const productRepo = dataSource.getRepository(Product);
    const batchRepo = dataSource.getRepository(InventoryBatch);
    const saleRepo = dataSource.getRepository(Sale);
    const saleItemRepo = dataSource.getRepository(SaleItem);
    const movementRepo = dataSource.getRepository(StockMovement);

    const store = await storeRepo.save({
      id: '10000000-0000-4000-8000-000000000023',
      name: 'Rollback Store',
      settings: { tax_enabled: false },
    });

    await categoryRepo.save({
      id: '20000000-0000-4000-8000-000000000023',
      store_id: store.id,
      name: 'General',
    });

    const cashier = await userRepo.save({
      id: '30000000-0000-4000-8000-000000000023',
      email: 'cashier-rollback@example.com',
      full_name: 'Cashier Rollback',
      is_active: true,
    });

    const product = await productRepo.save({
      id: '40000000-0000-4000-8000-000000000023',
      store_id: store.id,
      category_id: '20000000-0000-4000-8000-000000000023',
      sku: 'SKU-ROLLBACK',
      name: 'Sugar',
      unit: 'pcs',
      retail_price: 60,
      cost_price: 30,
      current_stock: 5,
      is_active: true,
    });

    await batchRepo.save({
      id: '50000000-0000-4000-8000-000000000023',
      store_id: store.id,
      product_id: product.id,
      batch_number: 'BROLLBACK',
      purchase_date: new Date('2026-02-03'),
      unit_cost: 30,
      initial_quantity: 3,
      current_quantity: 3,
      wholesale_price: 45,
      retail_price: 60,
      is_active: true,
    });

    await expect(
      salesService.create(
        {
          items: [{ product_id: product.id, quantity: 5, unit_price: 60 }],
          amount_paid: 500,
        } as any,
        store.id,
        cashier.id,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    const updatedProduct = await productRepo.findOneByOrFail({ id: product.id });
    const updatedBatch = await batchRepo.findOneByOrFail({
      id: '50000000-0000-4000-8000-000000000023',
    });

    expect(updatedProduct.current_stock).toBe(5);
    expect(updatedBatch.current_quantity).toBe(3);
    expect(await saleRepo.count()).toBe(0);
    expect(await saleItemRepo.count()).toBe(0);
    expect(await movementRepo.count()).toBe(0);
  });

  it('allows the same daily sale number sequence in different stores', async () => {
    const storeRepo = dataSource.getRepository(Store);
    const categoryRepo = dataSource.getRepository(Category);
    const userRepo = dataSource.getRepository(User);
    const productRepo = dataSource.getRepository(Product);
    const batchRepo = dataSource.getRepository(InventoryBatch);

    const storeA = await storeRepo.save({
      id: '10000000-0000-4000-8000-000000000024',
      name: 'Store Seq A',
      settings: { tax_enabled: false },
    });

    const storeB = await storeRepo.save({
      id: '10000000-0000-4000-8000-000000000025',
      name: 'Store Seq B',
      settings: { tax_enabled: false },
    });

    await categoryRepo.save([
      {
        id: '20000000-0000-4000-8000-000000000024',
        store_id: storeA.id,
        name: 'General A',
      },
      {
        id: '20000000-0000-4000-8000-000000000025',
        store_id: storeB.id,
        name: 'General B',
      },
    ]);

    const cashier = await userRepo.save({
      id: '30000000-0000-4000-8000-000000000024',
      email: 'cashier-seq@example.com',
      full_name: 'Cashier Seq',
      is_active: true,
    });

    const productA = await productRepo.save({
      id: '40000000-0000-4000-8000-000000000024',
      store_id: storeA.id,
      category_id: '20000000-0000-4000-8000-000000000024',
      sku: 'SKU-SEQ-A',
      name: 'Store A Product',
      unit: 'pcs',
      retail_price: 50,
      cost_price: 30,
      current_stock: 2,
      is_active: true,
    });

    const productB = await productRepo.save({
      id: '40000000-0000-4000-8000-000000000025',
      store_id: storeB.id,
      category_id: '20000000-0000-4000-8000-000000000025',
      sku: 'SKU-SEQ-B',
      name: 'Store B Product',
      unit: 'pcs',
      retail_price: 60,
      cost_price: 35,
      current_stock: 2,
      is_active: true,
    });

    await batchRepo.save([
      {
        id: '50000000-0000-4000-8000-000000000024',
        store_id: storeA.id,
        product_id: productA.id,
        batch_number: 'BSEQ-A',
        purchase_date: new Date('2026-02-04'),
        unit_cost: 30,
        initial_quantity: 2,
        current_quantity: 2,
        wholesale_price: 40,
        retail_price: 50,
        is_active: true,
      },
      {
        id: '50000000-0000-4000-8000-000000000025',
        store_id: storeB.id,
        product_id: productB.id,
        batch_number: 'BSEQ-B',
        purchase_date: new Date('2026-02-04'),
        unit_cost: 35,
        initial_quantity: 2,
        current_quantity: 2,
        wholesale_price: 45,
        retail_price: 60,
        is_active: true,
      },
    ]);

    const saleA = await salesService.create(
      {
        items: [{ product_id: productA.id, quantity: 1, unit_price: 50 }],
        amount_paid: 50,
      } as any,
      storeA.id,
      cashier.id,
    );

    const saleB = await salesService.create(
      {
        items: [{ product_id: productB.id, quantity: 1, unit_price: 60 }],
        amount_paid: 60,
      } as any,
      storeB.id,
      cashier.id,
    );

    expect(saleA.sale_number).toMatch(/^SALE-\d{8}-0001$/);
    expect(saleB.sale_number).toBe(saleA.sale_number);
  });
});
