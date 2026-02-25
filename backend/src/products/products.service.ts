import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, MoreThan } from 'typeorm';
import { Product } from '../database/entities/product.entity';
import { InventoryBatch } from '../database/entities/inventory-batch.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(InventoryBatch)
    private batchRepository: Repository<InventoryBatch>,
  ) {}

  private async getNextFifoCostByProductId(
    storeId: string,
  ): Promise<Map<string, { unitCost: number; purchaseDate: Date }>> {
    const nextFifoMap = new Map<string, { unitCost: number; purchaseDate: Date }>();
    const batches = await this.batchRepository.find({
      where: {
        store_id: storeId,
        is_active: true,
        current_quantity: MoreThan(0),
      },
      order: {
        purchase_date: 'ASC',
        created_at: 'ASC',
      },
    });

    for (const batch of batches) {
      if (!nextFifoMap.has(batch.product_id)) {
        nextFifoMap.set(batch.product_id, {
          unitCost: Number(batch.unit_cost),
          purchaseDate: new Date(batch.purchase_date),
        });
      }
    }
    return nextFifoMap;
  }

  async create(
    createProductDto: CreateProductDto,
    storeId: string,
  ): Promise<Product> {
    const product = this.productRepository.create({
      ...createProductDto,
      store_id: storeId,
    });
    return await this.productRepository.save(product);
  }

  async findAllByStore(
    storeId: string,
    categoryId?: string,
  ): Promise<Product[]> {
    const where: any = { store_id: storeId, is_active: true };
    if (categoryId) {
      where.category_id = categoryId;
    }
    const products = await this.productRepository.find({
      where,
      relations: ['category'],
      order: { name: 'ASC' },
    });
    const nextFifoMap = await this.getNextFifoCostByProductId(storeId);
    return products.map((product) => {
      const fifo = nextFifoMap.get(product.id);
      return {
        ...product,
        next_fifo_unit_cost: fifo?.unitCost ?? null,
        next_fifo_purchase_date: fifo?.purchaseDate ?? null,
      } as Product;
    });
  }

  async search(storeId: string, query: string): Promise<Product[]> {
    const products = await this.productRepository.find({
      where: [
        { store_id: storeId, name: ILike(`%${query}%`), is_active: true },
        { store_id: storeId, sku: ILike(`%${query}%`), is_active: true },
        { store_id: storeId, barcode: ILike(`%${query}%`), is_active: true },
      ],
      relations: ['category'],
      order: { name: 'ASC' },
    });
    const nextFifoMap = await this.getNextFifoCostByProductId(storeId);
    return products.map((product) => {
      const fifo = nextFifoMap.get(product.id);
      return {
        ...product,
        next_fifo_unit_cost: fifo?.unitCost ?? null,
        next_fifo_purchase_date: fifo?.purchaseDate ?? null,
      } as Product;
    });
  }

  async findOne(id: string, storeId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, store_id: storeId },
      relations: ['category'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    storeId: string,
  ): Promise<Product> {
    const product = await this.findOne(id, storeId);
    Object.assign(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  async remove(id: string, storeId: string): Promise<void> {
    const product = await this.findOne(id, storeId);
    product.is_active = false;
    await this.productRepository.save(product);
  }
}
