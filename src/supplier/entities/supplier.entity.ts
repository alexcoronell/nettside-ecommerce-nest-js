import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

import { BaseEntity } from '@commons/entities/baseEntity';
import { ProductSupplier } from '@product_supplier/entities/product-supplier.entity';
import { Purchase } from '@purchase/entities/purchase.entity';
import { User } from '@user/entities/user.entity';

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  name: string;

  @Column({
    name: 'contact_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  contactName: string;

  @Column({
    name: 'phone_number',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'web_page', type: 'varchar', length: 255, nullable: true })
  webPage: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  county: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city: string;

  @Column({
    name: 'street_address',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  streetAddress: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 255, nullable: true })
  postalCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string;

  /**************************** Relations ****************************/
  @ManyToOne(() => User, (user) => user.createdSuppliers)
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User;

  @ManyToOne(() => User, (user) => user.updatedSuppliers)
  @JoinColumn({ name: 'updated_by_user_id' })
  updatedBy: User;

  @ManyToOne(() => User, (user) => user.deletedSuppliers)
  @JoinColumn({ name: 'deleted_by_user_id' })
  deletedBy: User | null;

  @OneToMany(() => ProductSupplier, (items) => items.supplier)
  productSuppliers?: ProductSupplier[];

  @OneToMany(() => Purchase, (items) => items.supplier)
  purchases?: Purchase[];
}
