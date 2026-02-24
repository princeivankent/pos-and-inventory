import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual, MoreThan } from 'typeorm';
import { Product } from '../database/entities/product.entity';
import { InventoryBatch } from '../database/entities/inventory-batch.entity';
import {
  StockMovement,
  MovementType,
} from '../database/entities/stock-movement.entity';
import {
  StockAdjustmentDto,
  AdjustmentType,
} from './dto/stock-adjustment.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(InventoryBatch)
    private batchRepository: Repository<InventoryBatch>,
    @InjectRepository(StockMovement)
    private movementRepository: Repository<StockMovement>,
    private dataSource: DataSource,
  ) {}

  async adjust(
    dto: StockAdjustmentDto,
    storeId: string,
    userId: string,
  ): Promise<{ product: Product; movement: StockMovement }> {
    const product = await this.productRepository.findOne({
      where: { id: dto.product_id, store_id: storeId },
    });
    if (!product) {
      throw new NotFoundException(
        `Product with ID ${dto.product_id} not found`,
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      let batch: InventoryBatch;
      let movementType: MovementType;

      if (dto.type === AdjustmentType.STOCK_IN) {
        // Create new batch for stock-in
        batch = manager.create(InventoryBatch, {
          product_id: dto.product_id,
          store_id: storeId,
          batch_number: `ADJ-${Date.now()}`,
          purchase_date: new Date(),
          unit_cost: dto.unit_cost || product.cost_price,
          initial_quantity: dto.quantity,
          current_quantity: dto.quantity,
          wholesale_price: product.cost_price,
          retail_price: product.retail_price,
          is_active: true,
          supplier_id: dto.supplier_id || null,
        });
        batch = await manager.save(InventoryBatch, batch);

        product.current_stock = Number(product.current_stock) + dto.quantity;
        movementType = MovementType.PURCHASE;
      } else {
        // Stock out - validate sufficient stock
        if (Number(product.current_stock) < dto.quantity) {
          throw new BadRequestException(
            `Insufficient stock. Available: ${product.current_stock}, Requested: ${dto.quantity}`,
          );
        }

        // Pick oldest batch with remaining quantity (FIFO)
        const batches = await manager.find(InventoryBatch, {
          where: {
            product_id: dto.product_id,
            store_id: storeId,
            is_active: true,
            current_quantity: MoreThan(0),
          },
          order: { purchase_date: 'ASC' },
        });

        let remaining = dto.quantity;
        const firstBatch = batches[0];

        for (const b of batches) {
          if (remaining <= 0) break;
          const deduct = Math.min(Number(b.current_quantity), remaining);
          b.current_quantity = Number(b.current_quantity) - deduct;
          if (b.current_quantity === 0) {
            b.is_active = false;
          }
          await manager.save(InventoryBatch, b);
          remaining -= deduct;
        }

        if (!firstBatch || remaining > 0) {
          throw new BadRequestException(
            `Insufficient FIFO batch quantity. Available in active batches: ${dto.quantity - remaining}, Requested: ${dto.quantity}`,
          );
        }

        batch = firstBatch; // Use first batch for movement reference
        product.current_stock = Number(product.current_stock) - dto.quantity;
        movementType = MovementType.ADJUSTMENT;
      }

      await manager.save(Product, product);

      // Create stock movement record
      const movement = manager.create(StockMovement, {
        batch_id: batch.id,
        store_id: storeId,
        movement_type: movementType,
        quantity:
          dto.type === AdjustmentType.STOCK_IN ? dto.quantity : -dto.quantity,
        notes: dto.notes,
        created_by: userId,
      });
      const savedMovement = await manager.save(StockMovement, movement);

      return { product, movement: savedMovement };
    });
  }

  async getLowStock(storeId: string): Promise<Product[]> {
    return await this.productRepository
      .createQueryBuilder('product')
      .where('product.store_id = :storeId', { storeId })
      .andWhere('product.is_active = true')
      .andWhere('product.current_stock <= product.reorder_level')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.current_stock', 'ASC')
      .getMany();
  }

  async getMovements(
    storeId: string,
    productId?: string,
    movementType?: string,
    limit = 50,
    offset = 0,
  ): Promise<{ data: StockMovement[]; total: number }> {
    const where: any = { store_id: storeId };
    if (movementType) {
      where.movement_type = movementType;
    }

    const [data, total] = await this.movementRepository.findAndCount({
      where,
      relations: ['batch', 'batch.product', 'batch.supplier', 'creator'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });

    // Filter by product_id in application layer if specified
    if (productId) {
      const filtered = data.filter(
        (m) => m.batch?.product_id === productId,
      );
      return { data: filtered, total: filtered.length };
    }

    return { data, total };
  }
}
