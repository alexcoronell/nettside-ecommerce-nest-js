import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserSeeder } from '../database/seeders/user.seeder';
import { FakeUsersSeeder } from '../database/seeders/fake-users.seeder';

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly userSeeder: UserSeeder,
    private fakeUsersSeeder: FakeUsersSeeder,
  ) {}

  async onModuleInit() {
    const isProduction = process.env.IS_PRODUCTION;

    if (!isProduction || process.env.RUN_SEEDS === 'true') {
      this.logger.log('🌱 Running database seeds...');
      await this.userSeeder.seed();
      this.logger.log('✅ Seeds completed');
    }

    if (!isProduction || process.env.FAKE_DATA === 'true') {
      this.logger.log('🌱 Running database seeds...');
      await this.fakeUsersSeeder.seed();
      this.logger.log('✅ Seeds completed');
    }
  }
}
