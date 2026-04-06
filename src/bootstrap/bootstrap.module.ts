import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BootstrapService } from './bootstrap.service';
import { UserSeeder } from '../database/seeders/user.seeder';
import { FakeUsersSeeder } from '../database/seeders/fake-users.seeder';
import { User } from '@user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [BootstrapService, UserSeeder, FakeUsersSeeder],
})
export class BootstrapModule {}
