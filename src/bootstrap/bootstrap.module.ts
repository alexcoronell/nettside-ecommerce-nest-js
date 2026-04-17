import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BootstrapService } from './bootstrap.service';

/* Models */
import { Brand } from '@brand/entities/brand.entity';
import { Category } from '@category/entities/category.entity';
import { Discount } from '@discount/entities/discount.entity';
import { PaymentMethod } from '@payment_method/entities/payment-method.entity';
import { Product } from '@product/entities/product.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';
import { Supplier } from '@supplier/entities/supplier.entity';
import { Tag } from '@tag/entities/tag.entity';
import { User } from '@user/entities/user.entity';

/* Seeders */
import {
  FakeBrandsSeeder,
  FakeCategoriesSeeder,
  FakeDiscountsSeeder,
  FakePaymentMethodsSeeder,
  FakeProductsSeeder,
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
      Subcategory,
      Supplier,
      Tag,
      User,
    ]),
  ],
  providers: [
    BootstrapService,
    UserSeeder,
    FakeBrandsSeeder,
    FakeCategoriesSeeder,
    FakeDiscountsSeeder,
    FakePaymentMethodsSeeder,
    FakeProductsSeeder,
    FakeSubcategoriesSeeder,
    FakeSuppliersSeeder,
    FakeTagsSeeder,
    FakeUsersSeeder,
  ],
})
export class BootstrapModule {}
