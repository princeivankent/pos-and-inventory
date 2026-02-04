import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('stores')
export class Store extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: 'BIR TIN' })
  tax_id: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  settings: Record<string, any>;
}
