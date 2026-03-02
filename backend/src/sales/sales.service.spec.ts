import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SalesService } from './sales.service';
import { Product } from '../database/entities/product.entity';
import { Store } from '../database/entities/store.entity';
import { Sale } from '../database/entities/sale.entity';
import { SaleItem } from '../database/entities/sale-item.entity';
import { InventoryBatch } from '../database/entities/inventory-batch.entity';
import { StockMovement } from '../database/entities/stock-movement.entity';

describe('SalesService', () => {
  const baseDto = {
    items: [{ product_id: 'prod-1', quantity: 3, unit_price: 100 }],
    amount_paid: 500,
  };

  const createService = (
    manager: any,
    overrides?: {
      saleFindOne?: any;
      saleItemsFind?: any[];
    },
  ) => {
    const saleRepository = {
      findOne: jest.fn().mockResolvedValue(
        overrides?.saleFindOne || {
          id: 'sale-1',
          store_id: 'store-1',
          sale_number: 'SALE-20260224-0001',
        },
      ),
    };
    const saleItemRepository = {
      find: jest
        .fn()
        .mockResolvedValue(overrides?.saleItemsFind || [{ id: 'si-1' }]),
    };
    const dataSource = {
      transaction: jest.fn(async (cb: any) => cb(manager)),
    } as unknown as DataSource;

    const service = new SalesService(
      saleRepository as any,
      saleItemRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      dataSource,
    );

    return {
      service,
      saleRepository,
      saleItemRepository,
      dataSource,
    };
  };

  const queryBuilder = (lastSale: any) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(lastSale),
  });

  it('rejects creating sale when product is not in the current tenant store', async () => {
    const manager = {
      findOne: jest.fn().mockImplementation((entity: any) => {
        if (entity === Product) return null;
        return null;
      }),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder(null)),
    };

    const { service } = createService(manager);

    await expect(
      service.create(baseDto as any, 'store-1', 'cashier-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects when active FIFO batches cannot cover sold quantity', async () => {
    const product = {
      id: 'prod-1',
      name: 'Milk',
      store_id: 'store-1',
      is_active: true,
      current_stock: 10,
    };
    const manager = {
      findOne: jest.fn().mockImplementation((entity: any) => {
        if (entity === Product) return product;
        if (entity === Store) return { id: 'store-1', settings: {} };
        return null;
      }),
      find: jest.fn().mockImplementation((entity: any) => {
        if (entity === InventoryBatch) {
          return [
            {
              id: 'batch-1',
              product_id: 'prod-1',
              current_quantity: 1,
              is_active: true,
              purchase_date: new Date('2026-01-01'),
            },
          ];
        }
        return [];
      }),
      create: jest.fn().mockImplementation((_entity: any, payload: any) => ({
        ...payload,
      })),
      save: jest.fn().mockImplementation((entity: any, payload: any) => {
        if (entity === Sale) return { ...payload, id: 'sale-1' };
        return payload;
      }),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder(null)),
    };

    const { service } = createService(manager);

    await expect(
      service.create(baseDto as any, 'store-1', 'cashier-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a sale and allocates sold quantity using FIFO batches', async () => {
    const product = {
      id: 'prod-1',
      name: 'Milk',
      store_id: 'store-1',
      is_active: true,
      current_stock: 10,
    };
    const batchA = {
      id: 'batch-1',
      product_id: 'prod-1',
      current_quantity: 2,
      is_active: true,
      purchase_date: new Date('2026-01-01'),
    };
    const batchB = {
      id: 'batch-2',
      product_id: 'prod-1',
      current_quantity: 5,
      is_active: true,
      purchase_date: new Date('2026-01-10'),
    };

    const manager = {
      findOne: jest.fn().mockImplementation((entity: any) => {
        if (entity === Product) return product;
        if (entity === Store) return { id: 'store-1', settings: {} };
        return null;
      }),
      find: jest.fn().mockImplementation((entity: any) => {
        if (entity === InventoryBatch) return [batchA, batchB];
        return [];
      }),
      create: jest.fn().mockImplementation((_entity: any, payload: any) => ({
        ...payload,
      })),
      save: jest.fn().mockImplementation((entity: any, payload: any) => {
        if (entity === Sale) return { ...payload, id: 'sale-1' };
        return payload;
      }),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder(null)),
    };

    const { service, saleItemRepository } = createService(manager, {
      saleFindOne: {
        id: 'sale-1',
        store_id: 'store-1',
        sale_number: 'SALE-20260224-0001',
      },
      saleItemsFind: [{ id: 'si-1' }, { id: 'si-2' }],
    });

    const result = await service.create(baseDto as any, 'store-1', 'cashier-1');

    expect(result.id).toBe('sale-1');
    expect((result as any).items).toHaveLength(2);
    expect(saleItemRepository.find).toHaveBeenCalledWith({
      where: { sale_id: 'sale-1' },
      relations: ['product'],
    });

    const saleItemSaves = manager.save.mock.calls.filter(
      ([entity]: [any]) => entity === SaleItem,
    );
    const movementSaves = manager.save.mock.calls.filter(
      ([entity]: [any]) => entity === StockMovement,
    );
    expect(saleItemSaves).toHaveLength(2);
    expect(movementSaves).toHaveLength(2);
    expect(product.current_stock).toBe(7);
    expect(batchA.current_quantity).toBe(0);
    expect(batchA.is_active).toBe(false);
    expect(batchB.current_quantity).toBe(4);
  });
});
