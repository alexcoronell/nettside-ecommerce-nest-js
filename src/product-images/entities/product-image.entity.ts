import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@commons/entities/baseEntity';
import { Product } from '@product/entities/product.entity';
import { User } from '@user/entities/user.entity';

@Entity('product_images')
export class ProductImage extends BaseEntity {
  @Column({ name: 'file_path', type: 'varchar', length: 256, nullable: false })
  filePath!: string;

  @Column({ type: 'varchar', length: 256, nullable: false })
  title!: string;

  @Column({ name: 'is_main', type: 'boolean', default: false })
  isMain!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  /**************************** Relations ****************************/

  @ManyToOne(() => Product, (product) => product.images)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => User, (user) => user.createdProductImages)
  @JoinColumn({ name: 'created_by' })
  createdBy!: User;

  @ManyToOne(() => User, (user) => user.updatedProductImages)
  @JoinColumn({ name: 'updated_by' })
  updatedBy!: User;
}
