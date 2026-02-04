import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Product } from './product.entity';
import { Supplier } from './supplier.entity';

@Entity('inventory_batches')
@Index(['store_id', 'product_id', 'is_active'])
@Index(['store_id', 'batch_number'])
export class InventoryBatch extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'uuid', nullable: true })
  supplier_id: string;

  @Column({ type: 'varchar', length: 100 })
  batch_number: string;

  @Column({ type: 'date' })
  purchase_date: Date;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_cost: number;

  @Column({ type: 'integer' })
  initial_quantity: number;

  @Column({ type: 'integer' })
  current_quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  wholesale_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  retail_price: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;
}
