import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from './base.entity';

@Entity('customers')
@Index(['store_id', 'name'])
@Index(['store_id', 'phone'])
export class Customer extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({
    type: 'decimal', precision: 10, scale: 2, default: 0,
    transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) },
  })
  credit_limit: number;

  @Column({
    type: 'decimal', precision: 10, scale: 2, default: 0,
    transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) },
  })
  current_balance: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
