import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SalesService } from '../src/sales/sales.service';
import { Sale } from '../src/database/entities/sale.entity';
import { SaleItem } from '../src/database/entities/sale-item.entity';
import { Product } from '../src/database/entities/product.entity';
import { InventoryBatch } from '../src/database/entities/inventory-batch.entity';
import { StockMovement } from '../src/database/entities/stock-movement.entity';
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
});
