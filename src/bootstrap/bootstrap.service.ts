import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
    private readonly fakeProductsSeeder: FakeProductsSeeder,
    private readonly fakeSubcategoriesSeeder: FakeSubcategoriesSeeder,
    private readonly fakeSuppliersSeeder: FakeSuppliersSeeder,
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
      await this.fakeSuppliersSeeder.seed();
      await this.fakeTagsSeeder.seed();
      await this.fakeProductsSeeder.seed();
      this.logger.log('✅ Seeds completed');
    }
  }
}
