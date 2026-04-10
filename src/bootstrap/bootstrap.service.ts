import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserSeeder } from '../database/seeders/user.seeder';
import { FakeUsersSeeder } from '../database/seeders/fake-users.seeder';
import { FakeBrandsSeeder } from '../database/seeders/fake-brands.seeder';

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly userSeeder: UserSeeder,
    private readonly fakeUsersSeeder: FakeUsersSeeder,
    private readonly fakeBrandsSeeder: FakeBrandsSeeder,
  ) {}

  async onModuleInit() {
    const isProduction = process.env.IS_PRODUCTION;
    const isE2E = process.env.NODE_ENV === 'e2e';

    if (!isProduction || process.env.RUN_SEEDS === 'true' || !isE2E) {
      this.logger.log('🌱 Running database seeds...');
      await this.userSeeder.seed();
      this.logger.log('✅ Seeds completed');
    }

    if (!isProduction || process.env.FAKE_DATA === 'true') {
      this.logger.log('🌱 Running database seeds...');
      await this.fakeUsersSeeder.seed();
      await this.fakeBrandsSeeder.seed();
      this.logger.log('✅ Seeds completed');
    }
  }
}
