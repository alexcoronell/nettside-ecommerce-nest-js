import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BootstrapService } from './bootstrap.service';

/* Models */
import { Brand } from '@brand/entities/brand.entity';
import { Category } from '@category/entities/category.entity';
import { Discount } from '@discount/entities/discount.entity';
import { PaymentMethod } from '@payment_method/entities/payment-method.entity';
import { Product } from '@product/entities/product.entity';
import { ProductImage } from '@product_images/entities/product-image.entity';
import { Purchase } from '@purchase/entities/purchase.entity';
import { PurchaseDetail } from '@purchase_detail/entities/purchase-detail.entity';
import { Sale } from '@sale/entities/sale.entity';
import { SaleDetail } from '@sale_detail/entities/sale-detail.entity';
import { ShippingCompany } from '@shipping_company/entities/shipping-company.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';
import { StoreDetail } from '@store_detail/entities/store-detail.entity';
import { Supplier } from '@supplier/entities/supplier.entity';
import { Tag } from '@tag/entities/tag.entity';
import { User } from '@user/entities/user.entity';

/* Seeders */
import {
  DefaultStoreDetailsSeeder,
  FakeBrandsSeeder,
  FakeCategoriesSeeder,
  FakeDiscountsSeeder,
  FakePaymentMethodsSeeder,
  FakeProductsSeeder,
  FakeProductImageSeeder,
  FakePurchasesSeeder,
  FakeSalesSeeder,
  FakeShippingCompaniesSeeder,
  FakeStoreDetailsSeeder,
  FakeSubcategoriesSeeder,
  FakeSuppliersSeeder,
  FakeTagsSeeder,
  FakeUsersSeeder,
  UserSeeder,
} from '@database/seeders';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Brand,
      Category,
      Discount,
      PaymentMethod,
      Product,
      ProductImage,
      Purchase,
      PurchaseDetail,
      Sale,
      SaleDetail,
      ShippingCompany,
      Subcategory,
      StoreDetail,
      Supplier,
      Tag,
      User,
    ]),
  ],
  providers: [
    BootstrapService,
    DefaultStoreDetailsSeeder,
    FakeBrandsSeeder,
    FakeCategoriesSeeder,
    FakeDiscountsSeeder,
    FakePaymentMethodsSeeder,
    FakeProductsSeeder,
    FakeProductImageSeeder,
    FakePurchasesSeeder,
    FakeSalesSeeder,
    FakeShippingCompaniesSeeder,
    FakeStoreDetailsSeeder,
    FakeSubcategoriesSeeder,
    FakeSuppliersSeeder,
    FakeTagsSeeder,
    FakeUsersSeeder,
    UserSeeder,
  ],
})
export class BootstrapModule {}
