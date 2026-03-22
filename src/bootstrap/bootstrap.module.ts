import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BootstrapService } from './bootstrap.service';
import { UserSeeder } from 'src/database/seeders/user.seeder';
import { User } from '@user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [BootstrapService, UserSeeder],
})
export class BootstrapModule {}
