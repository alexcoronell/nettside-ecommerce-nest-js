import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BootstrapService } from './bootstrap.service';

/* Models */
import { User } from '@user/entities/user.entity';
import { Brand } from '@brand/entities/brand.entity';
import { Category } from '@category/entities/category.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';

/* Seeders */
import { UserSeeder } from '../database/seeders/user.seeder';
import { FakeUsersSeeder } from '../database/seeders/fake-users.seeder';
import { FakeBrandsSeeder } from '../database/seeders/fake-brands.seeder';
import { FakeCategoriesSeeder } from 'src/database/seeders/fake-categories.seeder';
import { FakeSubcategoriesSeeder } from '../database/seeders/fake-subcategories.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([User, Brand, Category, Subcategory])],
  providers: [
    BootstrapService,
    UserSeeder,
    FakeUsersSeeder,
    FakeBrandsSeeder,
    FakeCategoriesSeeder,
    FakeSubcategoriesSeeder,
  ],
})
export class BootstrapModule {}
