import { Test, TestingModule } from '@nestjs/testing';
import { BootstrapService } from './bootstrap.service';
import { UserSeeder } from '../database/seeders/user.seeder';

describe('BootstrapService', () => {
  let service: BootstrapService;
  let userSeeder: { seed: jest.Mock };

  beforeEach(async () => {
    userSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BootstrapService,
        {
          provide: UserSeeder,
          useValue: userSeeder,
        },
      ],
    }).compile();

    service = module.get<BootstrapService>(BootstrapService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should run seeds when IS_PRODUCTION is not set', async () => {
      const originalEnv = process.env.IS_PRODUCTION;
      delete process.env.IS_PRODUCTION;

      await service.onModuleInit();

      expect(userSeeder.seed).toHaveBeenCalledTimes(1);

      if (originalEnv) {
        process.env.IS_PRODUCTION = originalEnv;
      }
    });

    it('should run seeds when RUN_SEEDS is true in production', async () => {
      process.env.IS_PRODUCTION = 'true';
      process.env.RUN_SEEDS = 'true';

      await service.onModuleInit();

      expect(userSeeder.seed).toHaveBeenCalledTimes(1);

      delete process.env.RUN_SEEDS;
      delete process.env.IS_PRODUCTION;
    });

    it('should NOT run seeds in production when RUN_SEEDS is not set', async () => {
      process.env.IS_PRODUCTION = 'true';
      delete process.env.RUN_SEEDS;

      await service.onModuleInit();

      expect(userSeeder.seed).not.toHaveBeenCalled();

      delete process.env.IS_PRODUCTION;
    });

    it('should NOT run seeds in production when RUN_SEEDS is false', async () => {
      process.env.IS_PRODUCTION = 'true';
      process.env.RUN_SEEDS = 'false';

      await service.onModuleInit();

      expect(userSeeder.seed).not.toHaveBeenCalled();

      delete process.env.RUN_SEEDS;
      delete process.env.IS_PRODUCTION;
    });
  });
});
