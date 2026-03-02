import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Sale } from './sale.entity';
import { Product } from './product.entity';
import { InventoryBatch } from './inventory-batch.entity';

@Entity('sale_items')
@Index(['sale_id'])
export class SaleItem extends BaseEntity {
  @Column({ type: 'uuid' })
  sale_id: string;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'uuid', nullable: true })
  batch_id: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({
    type: 'decimal', precision: 10, scale: 2,
    transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) },
  })
  unit_price: number;

  @Column({
    type: 'decimal', precision: 10, scale: 2,
    transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) },
  })
  subtotal: number;

  @Column({
    type: 'decimal', precision: 10, scale: 2, nullable: true,
    transformer: { to: (value: number) => value, from: (value: string) => (value == null ? null : parseFloat(value)) },
  })
  unit_cost_snapshot: number | null;

  @Column({
    type: 'decimal', precision: 10, scale: 2, nullable: true,
    transformer: { to: (value: number) => value, from: (value: string) => (value == null ? null : parseFloat(value)) },
  })
  cogs_subtotal: number | null;

  @ManyToOne(() => Sale)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => InventoryBatch, { nullable: true })
  @JoinColumn({ name: 'batch_id' })
  batch: InventoryBatch;
}
