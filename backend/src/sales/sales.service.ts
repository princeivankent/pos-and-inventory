import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, MoreThan, In } from 'typeorm';
import { Sale, SaleStatus, PaymentMethod } from '../database/entities/sale.entity';
import { SaleItem } from '../database/entities/sale-item.entity';
import { Product } from '../database/entities/product.entity';
import { InventoryBatch } from '../database/entities/inventory-batch.entity';
import {
  StockMovement,
  MovementType,
} from '../database/entities/stock-movement.entity';
import { Store } from '../database/entities/store.entity';
import { Customer } from '../database/entities/customer.entity';
import { CreateSaleDto, DiscountType } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(InventoryBatch)
    private batchRepository: Repository<InventoryBatch>,
    @InjectRepository(StockMovement)
    private movementRepository: Repository<StockMovement>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    private dataSource: DataSource,
  ) {}

  async create(
    dto: CreateSaleDto,
    storeId: string,
    cashierId: string,
  ): Promise<Sale> {
    const result = await this.dataSource.transaction(async (manager) => {
      // 0. Validate customer if provided
      let customer: Customer | null = null;
      if (dto.customer_id) {
        customer = await manager.findOne(Customer, {
          where: { id: dto.customer_id, store_id: storeId, is_active: true },
        });
        if (!customer) {
          throw new NotFoundException(
            `Customer with ID ${dto.customer_id} not found`,
          );
        }
      }

      // 1. Validate all products and check stock
      const productMap = new Map<string, Product>();
      for (const item of dto.items) {
        const product = await manager.findOne(Product, {
          where: { id: item.product_id, store_id: storeId, is_active: true },
        });
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.product_id} not found`,
          );
        }
        if (Number(product.current_stock) < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}". Available: ${product.current_stock}, Requested: ${item.quantity}`,
          );
        }
        productMap.set(item.product_id, product);
      }

      // 2. Calculate totals
      let subtotal = 0;
      for (const item of dto.items) {
        const itemSubtotal = item.unit_price * item.quantity;
        const itemDiscount = item.discount || 0;
        subtotal += itemSubtotal - itemDiscount;
      }

      // Apply whole-sale discount
      let discountAmount = 0;
      if (dto.discount_amount) {
        if (dto.discount_type === DiscountType.PERCENTAGE) {
          discountAmount = subtotal * (dto.discount_amount / 100);
        } else {
          discountAmount = dto.discount_amount;
        }
      }

      // Get store settings for tax
      const store = await manager.findOne(Store, { where: { id: storeId } });
      const taxEnabled = store?.settings?.tax_enabled !== false;
      const rawTaxRate = store?.settings?.tax_rate;
      const taxRate = rawTaxRate != null ? rawTaxRate / 100 : 0.12;

      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxEnabled ? taxableAmount * taxRate : 0;
      const totalAmount = taxableAmount + taxAmount;
      const changeAmount = Math.max(0, dto.amount_paid - totalAmount);

      // 3. Determine payment method and credit amount
      let paymentMethod = PaymentMethod.CASH;
      let creditAmount = 0;

      if (dto.payment_method === 'credit' || dto.payment_method === 'partial') {
        if (!customer) {
          throw new BadRequestException(
            'A customer must be selected for credit or partial payment',
          );
        }
        paymentMethod =
          dto.payment_method === 'credit'
            ? PaymentMethod.CREDIT
            : PaymentMethod.PARTIAL;

        creditAmount =
          dto.credit_amount != null
            ? dto.credit_amount
            : Math.max(0, totalAmount - dto.amount_paid);

        // Validate credit limit
        const newBalance = Number(customer.current_balance) + creditAmount;
        if (newBalance > Number(customer.credit_limit)) {
          throw new BadRequestException(
            `Credit limit exceeded. Limit: ${customer.credit_limit}, Current balance: ${customer.current_balance}, Requested credit: ${creditAmount}`,
          );
        }
      }

      // 4. Generate sale number
      const saleNumber = await this.generateSaleNumber(manager, storeId);

      // 5. Create sale record
      const sale = manager.create(Sale, {
        sale_number: saleNumber,
        store_id: storeId,
        customer_id: dto.customer_id || null,
        cashier_id: cashierId,
        sale_date: new Date(),
        subtotal,
        tax_amount: Math.round(taxAmount * 100) / 100,
        discount_amount: Math.round(discountAmount * 100) / 100,
        total_amount: Math.round(totalAmount * 100) / 100,
        payment_method: paymentMethod,
        amount_paid: dto.amount_paid,
        change_amount: Math.round(changeAmount * 100) / 100,
        credit_amount: Math.round(creditAmount * 100) / 100,
        notes: dto.notes,
        status: SaleStatus.COMPLETED,
      });
      const savedSale = await manager.save(Sale, sale);

      // 5. Process each item - create SaleItems, deduct stock, create movements
      for (const item of dto.items) {
        const product = productMap.get(item.product_id);

        // Select batches FIFO
        const batches = await manager.find(InventoryBatch, {
          where: {
            product_id: item.product_id,
            store_id: storeId,
            is_active: true,
            current_quantity: MoreThan(0),
          },
          order: { purchase_date: 'ASC' },
        });

        let remaining = item.quantity;
        for (const batch of batches) {
          if (remaining <= 0) break;

          const deduct = Math.min(Number(batch.current_quantity), remaining);

          // Create sale item for this batch portion
          const saleItem = manager.create(SaleItem, {
            sale_id: savedSale.id,
            product_id: item.product_id,
            batch_id: batch.id,
            quantity: deduct,
            unit_price: item.unit_price,
            subtotal: item.unit_price * deduct,
          });
          await manager.save(SaleItem, saleItem);

          // Create stock movement
          const movement = manager.create(StockMovement, {
            batch_id: batch.id,
            store_id: storeId,
            movement_type: MovementType.SALE,
            quantity: -deduct,
            reference_id: savedSale.id,
            reference_type: 'sale',
            created_by: cashierId,
          });
          await manager.save(StockMovement, movement);

          // Deduct from batch
          batch.current_quantity = Number(batch.current_quantity) - deduct;
          if (batch.current_quantity === 0) {
            batch.is_active = false;
          }
          await manager.save(InventoryBatch, batch);

          remaining -= deduct;
        }

        // Strict FIFO mode: all sold quantity must be backed by active batches.
        // Prevents non-batch sale allocations that can break batch-level traceability.
        if (remaining > 0) {
          throw new BadRequestException(
            `Insufficient FIFO batch quantity for "${product.name}". Available in active batches: ${item.quantity - remaining}, Requested: ${item.quantity}`,
          );
        }

        // Deduct from product current_stock
        product.current_stock = Number(product.current_stock) - item.quantity;
        await manager.save(Product, product);
      }

      // Update customer balance if credit was used
      if (customer && creditAmount > 0) {
        customer.current_balance =
          Math.round((Number(customer.current_balance) + creditAmount) * 100) /
          100;
        await manager.save(Customer, customer);
      }

      return savedSale;
    });

    // Return the full sale with items and product details
    return this.findOne(result.id, storeId);
  }

  async findDailySales(storeId: string, date: string): Promise<Sale[]> {
    const startDate = new Date(date + 'T00:00:00');
    const endDate = new Date(date + 'T23:59:59.999');

    const sales = await this.saleRepository.find({
      where: {
        store_id: storeId,
        sale_date: Between(startDate, endDate),
      },
      relations: ['cashier'],
      order: { sale_date: 'DESC' },
    });

    if (sales.length > 0) {
      const saleIds = sales.map(s => s.id);
      const items = await this.saleItemRepository.find({
        where: { sale_id: In(saleIds) },
        relations: ['product'],
      });

      const itemsBySaleId = new Map<string, SaleItem[]>();
      for (const item of items) {
        const list = itemsBySaleId.get(item.sale_id) || [];
        list.push(item);
        itemsBySaleId.set(item.sale_id, list);
      }

      for (const sale of sales) {
        (sale as any).items = itemsBySaleId.get(sale.id) || [];
      }
    }

    return sales;
  }

  async findOne(id: string, storeId: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id, store_id: storeId },
      relations: ['cashier'],
    });
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    // Load sale items separately with product info
    const items = await this.saleItemRepository.find({
      where: { sale_id: id },
      relations: ['product'],
    });

    return { ...sale, items } as any;
  }

  async voidSale(id: string, storeId: string, userId: string): Promise<Sale> {
    return await this.dataSource.transaction(async (manager) => {
      const sale = await manager.findOne(Sale, {
        where: { id, store_id: storeId },
      });
      if (!sale) {
        throw new NotFoundException(`Sale with ID ${id} not found`);
      }
      if (sale.status === SaleStatus.VOID) {
        throw new BadRequestException('Sale is already voided');
      }

      // Load sale items
      const items = await manager.find(SaleItem, {
        where: { sale_id: id },
      });

      // Restock products
      for (const item of items) {
        const product = await manager.findOne(Product, {
          where: { id: item.product_id },
        });
        if (product) {
          product.current_stock = Number(product.current_stock) + item.quantity;
          await manager.save(Product, product);
        }

        // Restock batch if it exists
        if (item.batch_id) {
          const batch = await manager.findOne(InventoryBatch, {
            where: { id: item.batch_id },
          });
          if (batch) {
            batch.current_quantity =
              Number(batch.current_quantity) + item.quantity;
            batch.is_active = true;
            await manager.save(InventoryBatch, batch);
          }

          // Create return movement
          const movement = manager.create(StockMovement, {
            batch_id: item.batch_id,
            store_id: storeId,
            movement_type: MovementType.RETURN,
            quantity: item.quantity,
            reference_id: sale.id,
            reference_type: 'void',
            notes: `Void of sale ${sale.sale_number}`,
            created_by: userId,
          });
          await manager.save(StockMovement, movement);
        }
      }

      // Reverse customer credit if applicable
      if (sale.customer_id && sale.credit_amount > 0) {
        const customer = await manager.findOne(Customer, {
          where: { id: sale.customer_id },
        });
        if (customer) {
          customer.current_balance =
            Math.round(
              (Number(customer.current_balance) - sale.credit_amount) * 100,
            ) / 100;
          if (customer.current_balance < 0) customer.current_balance = 0;
          await manager.save(Customer, customer);
        }
      }

      sale.status = SaleStatus.VOID;
      return await manager.save(Sale, sale);
    });
  }

  private async generateSaleNumber(
    manager: any,
    storeId: string,
  ): Promise<string> {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const prefix = `SALE-${dateStr}-`;

    // Find the last sale number for today
    const lastSale = await manager
      .createQueryBuilder(Sale, 'sale')
      .where('sale.store_id = :storeId', { storeId })
      .andWhere('sale.sale_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('sale.sale_number', 'DESC')
      .getOne();

    let nextNum = 1;
    if (lastSale) {
      const lastNum = parseInt(lastSale.sale_number.split('-').pop(), 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
  }
}
