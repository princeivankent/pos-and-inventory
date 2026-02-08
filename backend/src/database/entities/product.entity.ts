import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Category } from './category.entity';

@Entity('products')
@Index(['store_id', 'sku'])
@Index(['store_id', 'barcode'])
@Index(['store_id', 'is_active'])
export class Product extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  category_id: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'pcs' })
  unit: string;

  @Column({ type: 'integer', default: 0 })
  reorder_level: number;

  @Column({ type: 'boolean', default: false })
  has_expiry: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  retail_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cost_price: number;

  @Column({ type: 'integer', default: 0 })
  current_stock: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
