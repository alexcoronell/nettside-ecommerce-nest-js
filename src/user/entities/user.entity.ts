import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

import { BaseEntity } from '@commons/entities/baseEntity';

/* Enums */
import { UserRoleEnum } from '@commons/enums/user-role.enum';

/* Entities */
import { Brand } from '@brand/entities/brand.entity';
import { Category } from '@category/entities/category.entity';
import { Discount } from '@discount/entities/discount.entity';
import { PaymentMethod } from '@payment_method/entities/payment-method.entity';
import { Product } from '@product/entities/product.entity';
import { ProductDiscount } from '@product_discount/entities/product-discount.entity';
import { ProductImage } from '@product_images/entities/product-image.entity';
import { ProductSupplier } from '@product_supplier/entities/product-supplier.entity';
import { ProductTag } from '@product_tag/entities/product-tag.entity';
import { Purchase } from '@purchase/entities/purchase.entity';
import { Sale } from '@sale/entities/sale.entity';
import { Shipment } from '@shipment/entities/shipment.entity';
import { ShippingCompany } from '@shipping_company/entities/shipping-company.entity';
import { StoreDetail } from '@store_detail/entities/store-detail.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';
import { Supplier } from '@supplier/entities/supplier.entity';
import { Wishlist } from '@wishlist/entities/wishlist.entity';
import { Tag } from '@tag/entities/tag.entity';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ name: 'first_name', type: 'varchar', length: 255 })
  firstname!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 255 })
  lastname!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string | undefined;

  @Column({ name: 'phone_number', type: 'varchar', length: 255 })
  phoneNumber!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({
    type: 'enum',
    enum: UserRoleEnum,
    default: UserRoleEnum.CUSTOMER,
    nullable: false,
  })
  role!: UserRoleEnum;

  @Column({ type: 'varchar', length: 100 })
  department!: string;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'varchar', length: 255 })
  address!: string;

  @Column({ type: 'varchar', length: 255 })
  neighborhood!: string;

  /**************************** Relations ****************************/
  /* Users */
  @ManyToOne(() => User, (user) => user.createdUsers)
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy?: User | null;

  @ManyToOne(() => User, (user) => user.updatedUsers)
  @JoinColumn({ name: 'updated_by_user_id' })
  updatedBy?: User | null;

  @ManyToOne(() => User, (user) => user.deletedUsers, { nullable: true })
  @JoinColumn({ name: 'deleted_by_user_id' })
  deletedBy?: User | null;

  @OneToMany(() => User, (users) => users.createdBy)
  createdUsers?: User[];

  @OneToMany(() => User, (users) => users.updatedBy)
  updatedUsers?: User[];

  @OneToMany(() => User, (users) => users.deletedBy)
  deletedUsers?: User[];

  /* Brands */
  @OneToMany(() => Brand, (items) => items.createdBy)
  createdBrands?: Brand[];

  @OneToMany(() => Brand, (items) => items.updatedBy)
  updatedBrands?: Brand[];

  @OneToMany(() => Brand, (items) => items.deletedBy)
  deletedBrands?: Brand[];

  /* Categories */
  @OneToMany(() => Category, (items) => items.createdBy)
  createdCategories?: Category[];

  @OneToMany(() => Category, (items) => items.updatedBy)
  updatedCategories?: Category[];

  @OneToMany(() => Category, (items) => items.deletedBy)
  deletedCategories?: Category[];

  /* Discounts */
  @OneToMany(() => Discount, (items) => items.createdBy)
  createdDiscounts?: Discount[];

  @OneToMany(() => Discount, (items) => items.updatedBy)
  updatedDiscounts?: Discount[];

  @OneToMany(() => Discount, (items) => items.deletedBy)
  deletedDiscounts?: Discount[];

  /* Payment Methods */
  @OneToMany(() => PaymentMethod, (items) => items.createdBy)
  createdPaymentMethods?: PaymentMethod[];

  @OneToMany(() => PaymentMethod, (items) => items.updatedBy)
  updatedPaymentMethods?: PaymentMethod[];

  @OneToMany(() => PaymentMethod, (items) => items.deletedBy)
  deletedPaymentMethods?: PaymentMethod[];

  /* Products */
  @OneToMany(() => Product, (items) => items.createdBy)
  createdProducts?: Product[];

  @OneToMany(() => Product, (items) => items.updatedBy)
  updatedProducts?: Product[];

  @OneToMany(() => Product, (items) => items.deletedBy)
  deletedProducts?: Product[];

  /* Products Discounts */
  @OneToMany(() => ProductDiscount, (items) => items.createdBy)
  createdProductDiscounts?: ProductDiscount[];

  /* Product Images */
  @OneToMany(() => ProductImage, (items) => items.createdBy)
  createdProductImages?: ProductImage[];

  @OneToMany(() => ProductImage, (items) => items.updatedBy)
  updatedProductImages?: ProductImage[];

  /* Product Suppliers */
  @OneToMany(() => ProductSupplier, (items) => items.createdBy)
  createdProductSuppliers?: ProductSupplier[];

  @OneToMany(() => ProductSupplier, (items) => items.updatedBy)
  updatedProductSuppliers?: ProductSupplier[];

  @OneToMany(() => ProductSupplier, (items) => items.deletedBy)
  deletedProductSuppliers?: ProductSupplier[];

  /* Product Tags */
  @OneToMany(() => ProductTag, (items) => items.createdBy)
  createdProductsTags?: ProductTag[];

  /* Purchases */
  @OneToMany(() => Purchase, (items) => items.createdBy)
  createdPurchases?: Purchase[];

  @OneToMany(() => Purchase, (items) => items.updatedBy)
  updatedPurchases?: Purchase[];

  @OneToMany(() => Purchase, (items) => items.deletedBy)
  deletedPurchases?: Purchase[];

  /* Sales */
  @OneToMany(() => Sale, (sale) => sale.user)
  sales?: Sale[];

  @OneToMany(() => Sale, (sale) => sale.cancelledBy)
  cancelledSales?: Sale[];

  /* Shipments */
  @OneToMany(() => Shipment, (items) => items.createdBy)
  createdShipments?: Shipment[];

  @OneToMany(() => Shipment, (items) => items.updatedBy)
  updatedShipments?: Shipment[];

  @OneToMany(() => Shipment, (items) => items.deletedBy)
  deletedShipments?: Shipment[];

  /* Shipping Companies */
  @OneToMany(() => ShippingCompany, (items) => items.createdBy)
  createdShippingCompanies?: ShippingCompany[];

  @OneToMany(() => ShippingCompany, (items) => items.updatedBy)
  updatedShippingCompanies?: ShippingCompany[];

  @OneToMany(() => ShippingCompany, (items) => items.deletedBy)
  deletedShippingCompanies?: ShippingCompany[];

  /* Store Details */
  @OneToMany(() => StoreDetail, (items) => items.createdBy)
  createdStoreDetail?: StoreDetail[];

  @OneToMany(() => StoreDetail, (items) => items.updatedBy)
  updatedStoreDetail?: StoreDetail[];

  /* Subcategories */
  @OneToMany(() => Subcategory, (items) => items.createdBy)
  createdSubcategories?: Subcategory[];

  @OneToMany(() => Subcategory, (items) => items.updatedBy)
  updatedSubcategories?: Subcategory[];

  @OneToMany(() => Subcategory, (items) => items.deletedBy)
  deletedSubcategories?: Subcategory[];

  /* Suppliers */
  @OneToMany(() => Supplier, (items) => items.createdBy)
  createdSuppliers?: Supplier[];

  @OneToMany(() => Supplier, (items) => items.updatedBy)
  updatedSuppliers?: Supplier[];

  @OneToMany(() => Supplier, (items) => items.deletedBy)
  deletedSuppliers?: Supplier[];

  /* Tags */
  @OneToMany(() => Tag, (items) => items.createdBy)
  createdTags?: Tag[];

  @OneToMany(() => Tag, (items) => items.updatedBy)
  updatedTags?: Tag[];

  @OneToMany(() => Tag, (items) => items.deletedBy)
  deletedTags?: Tag[];

  /* Wishlist */
  @OneToMany(() => Wishlist, (items) => items.user)
  wishlists?: Wishlist[];
}
