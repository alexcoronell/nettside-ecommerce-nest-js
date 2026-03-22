import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserSeeder } from 'src/database/seeders/user.seeder';

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(private readonly userSeeder: UserSeeder) {}

  async onModuleInit() {
    const isProduction = process.env.IS_PRODUCTION;

    if (!isProduction || process.env.RUN_SEEDS === 'true') {
      this.logger.log('🌱 Running database seeds...');
      await this.userSeeder.seed();
      this.logger.log('✅ Seeds completed');
    }
  }
}
