import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from './base.entity';

@Entity('suppliers')
@Index(['store_id', 'name'])
export class Supplier extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_person: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;
}
