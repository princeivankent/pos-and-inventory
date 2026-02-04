import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Product } from './product.entity';
import { User } from './user.entity';

export enum AlertType {
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  NEAR_EXPIRY = 'near_expiry',
  EXPIRED = 'expired',
}

@Entity('low_stock_alerts')
@Index(['store_id', 'is_resolved'])
@Index(['store_id', 'alert_date'])
export class LowStockAlert extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  product_id: string;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  alert_type: AlertType;

  @Column({ type: 'timestamp' })
  alert_date: Date;

  @Column({ type: 'boolean', default: false })
  is_resolved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  resolved_at: Date;

  @Column({ type: 'uuid', nullable: true })
  resolved_by: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolved_by' })
  resolver: User;
}
