import { Test, TestingModule } from '@nestjs/testing';
import { BootstrapService } from './bootstrap.service';
import { UserSeeder } from '../database/seeders/user.seeder';
import { FakeUsersSeeder } from '../database/seeders/fake-users.seeder';

describe('BootstrapService', () => {
  let service: BootstrapService;
  let userSeeder: { seed: jest.Mock };
  let fakeUsersSeeder: { seed: jest.Mock };

  beforeEach(async () => {
    userSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    fakeUsersSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BootstrapService,
        {
          provide: UserSeeder,
          useValue: userSeeder,
        },
        {
          provide: FakeUsersSeeder,
          useValue: fakeUsersSeeder,
        },
      ],
    }).compile();

    service = module.get<BootstrapService>(BootstrapService);
  });

  afterEach(() => {
    delete process.env.IS_PRODUCTION;
    delete process.env.RUN_SEEDS;
    delete process.env.FAKE_DATA;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should run userSeeder and fakeUsersSeeder when IS_PRODUCTION is not set', async () => {
      delete process.env.IS_PRODUCTION;

      await service.onModuleInit();

      expect(userSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeUsersSeeder.seed).toHaveBeenCalledTimes(1);
    });

    it('should run seeds when RUN_SEEDS is true in production', async () => {
      process.env.IS_PRODUCTION = 'true';
      process.env.RUN_SEEDS = 'true';

      await service.onModuleInit();

      expect(userSeeder.seed).toHaveBeenCalledTimes(1);
    });

    it('should NOT run seeds in production when RUN_SEEDS is not set', async () => {
      process.env.IS_PRODUCTION = 'true';
      delete process.env.RUN_SEEDS;

      await service.onModuleInit();

      expect(userSeeder.seed).not.toHaveBeenCalled();
    });

    it('should NOT run seeds in production when RUN_SEEDS is false', async () => {
      process.env.IS_PRODUCTION = 'true';
      process.env.RUN_SEEDS = 'false';

      await service.onModuleInit();

      expect(userSeeder.seed).not.toHaveBeenCalled();
    });

    it('should run fakeUsersSeeder when FAKE_DATA is true in production', async () => {
      process.env.IS_PRODUCTION = 'true';
      process.env.FAKE_DATA = 'true';

      await service.onModuleInit();

      expect(fakeUsersSeeder.seed).toHaveBeenCalledTimes(1);
    });

    it('should NOT run fakeUsersSeeder in production when FAKE_DATA is not set', async () => {
      process.env.IS_PRODUCTION = 'true';
      delete process.env.FAKE_DATA;

      await service.onModuleInit();

      expect(fakeUsersSeeder.seed).not.toHaveBeenCalled();
    });

    it('should NOT run fakeUsersSeeder in production when FAKE_DATA is false', async () => {
      process.env.IS_PRODUCTION = 'true';
      process.env.FAKE_DATA = 'false';

      await service.onModuleInit();

      expect(fakeUsersSeeder.seed).not.toHaveBeenCalled();
    });
  });
});
