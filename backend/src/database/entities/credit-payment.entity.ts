import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Customer } from './customer.entity';
import { Sale } from './sale.entity';
import { User } from './user.entity';

@Entity('credit_payments')
@Index(['store_id', 'customer_id'])
@Index(['store_id', 'payment_date'])
export class CreditPayment extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  customer_id: string;

  @Column({ type: 'uuid', nullable: true })
  sale_id: string;

  @Column({ type: 'timestamp' })
  payment_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 50, default: 'cash' })
  payment_method: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid' })
  recorded_by: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Sale, { nullable: true })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recorded_by' })
  recorder: User;
}
