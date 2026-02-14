import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Store } from './store.entity';

@Entity('organizations')
export class Organization extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'uuid' })
  owner_user_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  billing_email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  billing_phone: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tax_id: string;

  @Column({ type: 'text', nullable: true })
  billing_address: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => Store, (store) => store.organization)
  stores: Store[];
}
