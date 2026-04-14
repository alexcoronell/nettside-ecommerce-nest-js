import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

import { BaseEntity } from '@commons/entities/baseEntity';
import { Product } from '@product/entities/product.entity';
import { User } from '@user/entities/user.entity';

@Entity('brands')
export class Brand extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo: string | null;

  /**************************** Relations ****************************/
  @ManyToOne(() => User, (user) => user.createdBrands)
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User;

  @ManyToOne(() => User, (user) => user.updatedBrands)
  @JoinColumn({ name: 'updated_by_user_id' })
  updatedBy: User;

  @ManyToOne(() => User, (user) => user.deletedBrands)
  @JoinColumn({ name: 'deleted_by_user_id' })
  deletedBy: User | null;

  /* Products */
  @OneToMany(() => Product, (items) => items.brand)
  products?: Product[];
}
