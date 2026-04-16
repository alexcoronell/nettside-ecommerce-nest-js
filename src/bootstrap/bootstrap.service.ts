import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserSeeder } from '../database/seeders/user.seeder';
import {
  FakeBrandsSeeder,
  FakeCategoriesSeeder,
  FakeDiscountsSeeder,
  FakePaymentMethodsSeeder,
  FakeSubcategoriesSeeder,
  FakeTagsSeeder,
  FakeUsersSeeder,
} from '../database/seeders/';

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly userSeeder: UserSeeder,
    private readonly fakeBrandsSeeder: FakeBrandsSeeder,
    private readonly fakeCategoriesSeeder: FakeCategoriesSeeder,
    private readonly fakeDiscountsSeeder: FakeDiscountsSeeder,
    private readonly fakePaymentMethodsSeeder: FakePaymentMethodsSeeder,
    private readonly fakeSubcategoriesSeeder: FakeSubcategoriesSeeder,
    private readonly fakeTagsSeeder: FakeTagsSeeder,
    private readonly fakeUsersSeeder: FakeUsersSeeder,
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
      await this.fakeCategoriesSeeder.seed();
      await this.fakeDiscountsSeeder.seed();
      await this.fakePaymentMethodsSeeder.seed();
      await this.fakeSubcategoriesSeeder.seed();
      await this.fakeTagsSeeder.seed();
      this.logger.log('✅ Seeds completed');
    }
  }
}
