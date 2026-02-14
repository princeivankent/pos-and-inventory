import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('subscription_plans')
export class SubscriptionPlan extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  plan_code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price_php: number;

  @Column({ type: 'int', default: 1 })
  max_stores: number;

  @Column({ type: 'int', default: 3 })
  max_users_per_store: number;

  @Column({ type: 'int', default: 100 })
  max_products_per_store: number;

  @Column({ type: 'jsonb', default: {} })
  features: Record<string, boolean>;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
