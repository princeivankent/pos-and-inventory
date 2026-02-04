import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { InventoryBatch } from './inventory-batch.entity';
import { User } from './user.entity';

export enum MovementType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  EXPIRED = 'expired',
  DAMAGED = 'damaged',
}

@Entity('stock_movements')
@Index(['store_id', 'batch_id'])
@Index(['store_id', 'created_at'])
export class StockMovement extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  batch_id: string;

  @Column({
    type: 'enum',
    enum: MovementType,
  })
  movement_type: MovementType;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'uuid', nullable: true })
  reference_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference_type: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @ManyToOne(() => InventoryBatch)
  @JoinColumn({ name: 'batch_id' })
  batch: InventoryBatch;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
