import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BootstrapService } from './bootstrap.service';

/* Models */
import { Brand } from '@brand/entities/brand.entity';
import { Category } from '@category/entities/category.entity';
import { Discount } from '@discount/entities/discount.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';
import { User } from '@user/entities/user.entity';

/* Seeders */
import {
  FakeBrandsSeeder,
  FakeCategoriesSeeder,
  FakeDiscountsSeeder,
  FakeSubcategoriesSeeder,
  FakeUsersSeeder,
  UserSeeder,
} from '@database/seeders';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand, Category, Discount, Subcategory, User]),
  ],
  providers: [
    BootstrapService,
    UserSeeder,
    FakeBrandsSeeder,
    FakeCategoriesSeeder,
    FakeDiscountsSeeder,
    FakeSubcategoriesSeeder,
    FakeUsersSeeder,
  ],
})
export class BootstrapModule {}
