import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BootstrapService } from './bootstrap.service';

/* Models */
import { User } from '@user/entities/user.entity';
import { Brand } from '@brand/entities/brand.entity';
import { Category } from '@category/entities/category.entity';

/* Seeders */
import { UserSeeder } from '../database/seeders/user.seeder';
import { FakeUsersSeeder } from '../database/seeders/fake-users.seeder';
import { FakeBrandsSeeder } from '../database/seeders/fake-brands.seeder';
import { FakeCategoriesSeeder } from 'src/database/seeders/fake-categories.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([User, Brand, Category])],
  providers: [
    BootstrapService,
    UserSeeder,
    FakeUsersSeeder,
    FakeBrandsSeeder,
    FakeCategoriesSeeder,
  ],
})
export class BootstrapModule {}
