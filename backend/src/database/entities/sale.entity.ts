import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Customer } from './customer.entity';
import { User } from './user.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT = 'credit',
  PARTIAL = 'partial',
}

export enum SaleStatus {
  COMPLETED = 'completed',
  VOID = 'void',
  RETURNED = 'returned',
}

@Entity('sales')
@Index(['store_id', 'sale_date'])
@Index(['store_id', 'customer_id'])
@Index(['store_id', 'sale_number'])
export class Sale extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  sale_number: string;

  @Column({ type: 'uuid', nullable: true })
  customer_id: string;

  @Column({ type: 'uuid' })
  cashier_id: string;

  @Column({ type: 'timestamp' })
  sale_date: Date;

  @Column({
    type: 'decimal', precision: 10, scale: 2,
    transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) },
  })
  subtotal: number;

  @Column({
    type: 'decimal', precision: 10, scale: 2, default: 0,
    transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) },
  })
  tax_amount: number;

  @Column({
    type: 'decimal', precision: 10, scale: 2, default: 0,
    transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) },
  })
  discount_amount: number;

  @Column({
    type: 'decimal', precision: 10, scale: 2,
    transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) },
  })
  total_amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  payment_method: PaymentMethod;

  @Column({
    type: 'decimal', precision: 10, scale: 2, default: 0,
    transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) },
  })
  amount_paid: number;

  @Column({
    type: 'decimal', precision: 10, scale: 2, default: 0,
    transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) },
  })
  change_amount: number;

  @Column({
    type: 'decimal', precision: 10, scale: 2, default: 0,
    transformer: { to: (value: number) => value, from: (value: string) => parseFloat(value) },
  })
  credit_amount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.COMPLETED,
  })
  status: SaleStatus;

  @Column({ type: 'uuid', nullable: true })
  returned_from_sale_id: string;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cashier_id' })
  cashier: User;

  @ManyToOne(() => Sale, { nullable: true })
  @JoinColumn({ name: 'returned_from_sale_id' })
  returned_from_sale: Sale;
}
