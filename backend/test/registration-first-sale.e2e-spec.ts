import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { SalesController } from '../src/sales/sales.controller';
import { SalesService } from '../src/sales/sales.service';
import { InventoryController } from '../src/inventory/inventory.controller';
import { InventoryService } from '../src/inventory/inventory.service';
import { TenantGuard } from '../src/common/guards/tenant.guard';
import { SubscriptionGuard } from '../src/common/guards/subscription.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { FeatureGateGuard } from '../src/common/guards/feature-gate.guard';
import { UserRole } from '../src/database/entities/user-store.entity';
import { Permission } from '../src/common/permissions/permission.enum';

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () =>
    class MockJwtAuthGuard implements CanActivate {
      canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization as string | undefined;
        if (!authHeader?.startsWith('Bearer ')) {
          throw new UnauthorizedException('Missing bearer token');
        }

        const token = authHeader.replace('Bearer ', '');
        if (token !== 'e2e-access-token') {
          throw new UnauthorizedException('Invalid token');
        }

        request.user = {
          userId: 'user-1',
          email: 'e2e@example.com',
        };
        return true;
      }
    },
}));

class MockTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const storeId = request.headers['x-store-id'] as string | undefined;

    if (!storeId) {
      throw new ForbiddenException('Store header is required');
    }

    if (storeId !== 'store-1') {
      throw new ForbiddenException('Access to this store is denied');
    }

    request.user = {
      ...request.user,
      storeId,
      role: UserRole.ADMIN,
      permissions: [
        Permission.SALES_CREATE,
        Permission.SALES_VIEW,
        Permission.INVENTORY_ADJUST,
      ],
    };

    return true;
  }
}

describe('Registration to First Sale (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const productId = '11111111-1111-4111-8111-111111111111';

  type BatchState = {
    id: string;
    product_id: string;
    store_id: string;
    purchase_date: Date;
    current_quantity: number;
    is_active: boolean;
  };

  const inventoryState: {
    product: { id: string; store_id: string; current_stock: number };
    batches: BatchState[];
    batchCounter: number;
    movementCounter: number;
  } = {
    product: {
      id: productId,
      store_id: 'store-1',
      current_stock: 0,
    },
    batches: [],
    batchCounter: 0,
    movementCounter: 0,
  };

  const resetInventoryState = () => {
    inventoryState.product.current_stock = 0;
    inventoryState.batches = [];
    inventoryState.batchCounter = 0;
    inventoryState.movementCounter = 0;
  };

  const authServiceMock = {
    register: jest.fn().mockResolvedValue({
      access_token: 'e2e-access-token',
      refresh_token: 'e2e-refresh-token',
      user: {
        id: 'user-1',
        email: 'e2e@example.com',
        full_name: 'E2E Cashier',
      },
      stores: [
        {
          id: 'store-1',
          name: 'E2E Main Store',
          role: UserRole.ADMIN,
          is_default: true,
          permissions: [
            Permission.SALES_CREATE,
            Permission.SALES_VIEW,
            Permission.INVENTORY_ADJUST,
          ],
        },
      ],
      default_store: {
        id: 'store-1',
        name: 'E2E Main Store',
        role: UserRole.ADMIN,
        permissions: [
          Permission.SALES_CREATE,
          Permission.SALES_VIEW,
          Permission.INVENTORY_ADJUST,
        ],
      },
      subscription: {
        status: 'trial',
      },
    }),
  };

  const salesServiceMock = {
    create: jest.fn().mockImplementation((dto, storeId, cashierId) => {
      if (storeId !== inventoryState.product.store_id) {
        throw new BadRequestException('Invalid store');
      }

      const allocations: Array<{
        batch_id: string;
        product_id: string;
        quantity: number;
      }> = [];

      for (const item of dto.items) {
        if (item.product_id !== inventoryState.product.id) {
          throw new BadRequestException('Product not found');
        }
        if (inventoryState.product.current_stock < item.quantity) {
          throw new BadRequestException('Insufficient stock');
        }

        const sortedBatches = inventoryState.batches
          .filter((b) => b.is_active && b.current_quantity > 0)
          .sort(
            (a, b) =>
              a.purchase_date.getTime() - b.purchase_date.getTime(),
          );

        let remaining = item.quantity;
        for (const batch of sortedBatches) {
          if (remaining <= 0) {
            break;
          }
          const deduct = Math.min(batch.current_quantity, remaining);
          batch.current_quantity -= deduct;
          if (batch.current_quantity === 0) {
            batch.is_active = false;
          }
          allocations.push({
            batch_id: batch.id,
            product_id: item.product_id,
            quantity: deduct,
          });
          remaining -= deduct;
        }

        if (remaining > 0) {
          throw new BadRequestException('Insufficient FIFO batch quantity');
        }

        inventoryState.product.current_stock -= item.quantity;
      }

      const batchStock = inventoryState.batches.map((batch) => ({
        batch_id: batch.id,
        current_quantity: batch.current_quantity,
      }));

      return {
        id: 'sale-1',
        sale_number: 'SALE-20260224-0001',
        store_id: storeId,
        cashier_id: cashierId,
        total_amount: dto.items.reduce(
          (sum: number, item: any) => sum + item.quantity * item.unit_price,
          0,
        ),
        items: dto.items,
        allocations,
        remaining_stock: inventoryState.product.current_stock,
        batch_stock: batchStock,
      };
    }),
  };

  const inventoryServiceMock = {
    adjust: jest.fn().mockImplementation((dto, storeId, userId) => {
      if (dto.product_id !== inventoryState.product.id) {
        throw new BadRequestException('Product not found');
      }
      if (storeId !== inventoryState.product.store_id) {
        throw new BadRequestException('Invalid store');
      }
      if (dto.type !== 'stock_in') {
        throw new BadRequestException('Only stock_in is implemented in e2e mock');
      }

      inventoryState.batchCounter += 1;
      inventoryState.movementCounter += 1;
      const batchId = `batch-${inventoryState.batchCounter}`;

      inventoryState.batches.push({
        id: batchId,
        product_id: dto.product_id,
        store_id: storeId,
        purchase_date: new Date(2026, 1, inventoryState.batchCounter),
        current_quantity: dto.quantity,
        is_active: true,
      });
      inventoryState.product.current_stock += dto.quantity;

      return {
        product: {
          id: inventoryState.product.id,
          store_id: inventoryState.product.store_id,
          current_stock: inventoryState.product.current_stock,
        },
        movement: {
          id: `movement-${inventoryState.movementCounter}`,
          store_id: storeId,
          batch_id: batchId,
          movement_type: 'purchase',
          quantity: dto.quantity,
          created_by: userId,
        },
      };
    }),
  };

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [AuthController, SalesController, InventoryController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: SalesService, useValue: salesServiceMock },
        { provide: InventoryService, useValue: inventoryServiceMock },
      ],
    })
      .overrideGuard(TenantGuard)
      .useClass(MockTenantGuard)
      .overrideGuard(SubscriptionGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(FeatureGateGuard)
      .useValue({ canActivate: () => true });

    const moduleRef: TestingModule = await moduleBuilder.compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    await app.listen(0);
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    resetInventoryState();
  });

  const post = async (path: string, body: unknown, headers?: Record<string, string>) => {
    return fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(headers || {}),
      },
      body: JSON.stringify(body),
    });
  };

  it('completes registration then creates first cash sale in selected store', async () => {
    const registerPayload = {
      email: 'e2e@example.com',
      password: 'secret123',
      full_name: 'E2E Cashier',
      store_name: 'E2E Main Store',
    };

    const registerResponse = await post('/auth/register', registerPayload);
    expect(registerResponse.status).toBe(201);
    const registerData = await registerResponse.json();
    expect(registerData.access_token).toBe('e2e-access-token');
    expect(registerData.default_store.id).toBe('store-1');

    const stockInResponse = await post(
      '/inventory/adjust',
      {
        product_id: productId,
        type: 'stock_in',
        quantity: 3,
        unit_cost: 50,
      },
      {
        authorization: `Bearer ${registerData.access_token}`,
        'x-store-id': registerData.default_store.id,
      },
    );
    expect(stockInResponse.status).toBe(201);

    const salePayload = {
      items: [{ product_id: productId, quantity: 1, unit_price: 100 }],
      amount_paid: 120,
    };

    const saleResponse = await post('/sales', salePayload, {
      authorization: `Bearer ${registerData.access_token}`,
      'x-store-id': registerData.default_store.id,
    });
    expect(saleResponse.status).toBe(201);
    const saleData = await saleResponse.json();
    expect(saleData.id).toBe('sale-1');
    expect(salesServiceMock.create).toHaveBeenCalledWith(
      salePayload,
      'store-1',
      'user-1',
    );
  });

  it('blocks sale creation when token user targets a store they cannot access', async () => {
    const salePayload = {
      items: [{ product_id: productId, quantity: 1, unit_price: 100 }],
      amount_paid: 120,
    };

    const saleResponse = await post('/sales', salePayload, {
      authorization: 'Bearer e2e-access-token',
      'x-store-id': 'store-2',
    });

    expect(saleResponse.status).toBe(403);
    expect(salesServiceMock.create).not.toHaveBeenCalled();
  });

  it('deducts sold quantity from oldest batches first after stock-in', async () => {
    const registerResponse = await post('/auth/register', {
      email: 'e2e@example.com',
      password: 'secret123',
      full_name: 'E2E Cashier',
      store_name: 'E2E Main Store',
    });
    const registerData = await registerResponse.json();
    const authHeaders = {
      authorization: `Bearer ${registerData.access_token}`,
      'x-store-id': registerData.default_store.id,
    };

    const stockIn1 = await post(
      '/inventory/adjust',
      {
        product_id: productId,
        type: 'stock_in',
        quantity: 5,
        unit_cost: 40,
      },
      authHeaders,
    );
    expect(stockIn1.status).toBe(201);
    const stockIn1Data = await stockIn1.json();
    expect(stockIn1Data.product.current_stock).toBe(5);

    const stockIn2 = await post(
      '/inventory/adjust',
      {
        product_id: productId,
        type: 'stock_in',
        quantity: 7,
        unit_cost: 42,
      },
      authHeaders,
    );
    expect(stockIn2.status).toBe(201);
    const stockIn2Data = await stockIn2.json();
    expect(stockIn2Data.product.current_stock).toBe(12);

    const sale = await post(
      '/sales',
      {
        items: [{ product_id: productId, quantity: 6, unit_price: 100 }],
        amount_paid: 700,
      },
      authHeaders,
    );
    expect(sale.status).toBe(201);
    const saleData = await sale.json();

    expect(saleData.allocations).toEqual([
      { batch_id: 'batch-1', product_id: productId, quantity: 5 },
      { batch_id: 'batch-2', product_id: productId, quantity: 1 },
    ]);
    expect(saleData.batch_stock).toEqual([
      { batch_id: 'batch-1', current_quantity: 0 },
      { batch_id: 'batch-2', current_quantity: 6 },
    ]);
    expect(saleData.remaining_stock).toBe(6);
  });

  it('returns 400 when requested sale quantity exceeds remaining stock after prior sale', async () => {
    const registerResponse = await post('/auth/register', {
      email: 'e2e@example.com',
      password: 'secret123',
      full_name: 'E2E Cashier',
      store_name: 'E2E Main Store',
    });
    const registerData = await registerResponse.json();
    const authHeaders = {
      authorization: `Bearer ${registerData.access_token}`,
      'x-store-id': registerData.default_store.id,
    };

    const stockIn = await post(
      '/inventory/adjust',
      {
        product_id: productId,
        type: 'stock_in',
        quantity: 3,
        unit_cost: 40,
      },
      authHeaders,
    );
    expect(stockIn.status).toBe(201);

    const firstSale = await post(
      '/sales',
      {
        items: [{ product_id: productId, quantity: 2, unit_price: 100 }],
        amount_paid: 250,
      },
      authHeaders,
    );
    expect(firstSale.status).toBe(201);

    const secondSale = await post(
      '/sales',
      {
        items: [{ product_id: productId, quantity: 2, unit_price: 100 }],
        amount_paid: 250,
      },
      authHeaders,
    );
    expect(secondSale.status).toBe(400);
    const errorData = await secondSale.json();
    expect(errorData.message).toContain('Insufficient stock');
  });
});
