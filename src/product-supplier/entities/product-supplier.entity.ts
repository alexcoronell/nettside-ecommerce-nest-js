import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@commons/entities/baseEntity';
import { Product } from '@product/entities/product.entity';
import { Supplier } from '@supplier/entities/supplier.entity';
import { User } from '@user/entities/user.entity';
@Entity('product_suppliers')
export class ProductSupplier extends BaseEntity {
  @Column({
    name: 'supplier_product_code',
    type: 'varchar',
    length: 256,
    nullable: false,
  })
  supplierProductCode: string;

  @Column('decimal', {
    name: 'cost_price',
    precision: 10,
    scale: 2,
    default: 0,
  })
  costPrice: number;

  @Column({ name: 'is_primary_supplier', type: 'boolean', default: false })
  isPrimarySupplier: boolean;

  /**************************** Relations ****************************/
  @ManyToOne(() => Product, (product) => product.productSuppliers)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Supplier, (supplier) => supplier.productSuppliers)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @ManyToOne(() => User, (user) => user.createdProductSuppliers)
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User;

  @ManyToOne(() => User, (user) => user.updatedProductSuppliers)
  @JoinColumn({ name: 'updated_by_user_id' })
  updatedBy: User;

  @ManyToOne(() => User, (user) => user.deletedProductSuppliers)
  @JoinColumn({ name: 'deleted_by_user_id' })
  deletedBy: User | null;
}
