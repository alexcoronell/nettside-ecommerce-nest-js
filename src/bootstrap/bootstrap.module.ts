import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BootstrapService } from './bootstrap.service';
import { UserSeeder } from '../database/seeders/user.seeder';
import { FakeUsersSeeder } from '../database/seeders/fake-users.seeder';
import { FakeBrandsSeeder } from '../database/seeders/fake-brands.seeder';
import { User } from '@user/entities/user.entity';
import { Brand } from '@brand/entities/brand.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Brand])],
  providers: [BootstrapService, UserSeeder, FakeUsersSeeder, FakeBrandsSeeder],
})
export class BootstrapModule {}
