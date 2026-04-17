import { Test, TestingModule } from '@nestjs/testing';
import { BootstrapService } from './bootstrap.service';
import {
  DefaultStoreDetailsSeeder,
  FakeBrandsSeeder,
  FakeCategoriesSeeder,
  FakeDiscountsSeeder,
  FakePaymentMethodsSeeder,
  FakeProductsSeeder,
  FakeShippingCompaniesSeeder,
  FakeStoreDetailsSeeder,
  FakeSubcategoriesSeeder,
  FakeSuppliersSeeder,
  FakeTagsSeeder,
  FakeUsersSeeder,
  UserSeeder,
} from '@database/seeders';

describe('BootstrapService', () => {
  let service: BootstrapService;
  let userSeeder: { seed: jest.Mock };
  let defaultStoreDetailsSeeder: { seed: jest.Mock };
  let fakeUsersSeeder: { seed: jest.Mock };
  let fakeBrandsSeeder: { seed: jest.Mock };
  let fakeCategoriesSeeder: { seed: jest.Mock };
  let fakeDiscountsSeeder: { seed: jest.Mock };
  let fakePaymentMethodsSeeder: { seed: jest.Mock };
  let fakeShippingCompaniesSeeder: { seed: jest.Mock };
  let fakeStoreDetailsSeeder: { seed: jest.Mock };
  let fakeSuppliersSeeder: {
    seed: jest.Mock;
  };
  let fakeSubcategoriesSeeder: { seed: jest.Mock };
  let fakeProductsSeeder: { seed: jest.Mock };
  let fakeTagsSeeder: { seed: jest.Mock };

  const originalEnv = { ...process.env };
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    process.env = { ...originalEnv };

    userSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    defaultStoreDetailsSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    fakeUsersSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    fakeBrandsSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    fakeCategoriesSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    fakeDiscountsSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    fakePaymentMethodsSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    fakeShippingCompaniesSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    fakeStoreDetailsSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    fakeSubcategoriesSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    fakeSuppliersSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    fakeTagsSeeder = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    fakeProductsSeeder = {
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
          provide: DefaultStoreDetailsSeeder,
          useValue: defaultStoreDetailsSeeder,
        },
        {
          provide: FakeUsersSeeder,
          useValue: fakeUsersSeeder,
        },
        {
          provide: FakeBrandsSeeder,
          useValue: fakeBrandsSeeder,
        },
        {
          provide: FakeCategoriesSeeder,
          useValue: fakeCategoriesSeeder,
        },
        {
          provide: FakeDiscountsSeeder,
          useValue: fakeDiscountsSeeder,
        },
        {
          provide: FakePaymentMethodsSeeder,
          useValue: fakePaymentMethodsSeeder,
        },
        {
          provide: FakeShippingCompaniesSeeder,
          useValue: fakeShippingCompaniesSeeder,
        },
        {
          provide: FakeStoreDetailsSeeder,
          useValue: fakeStoreDetailsSeeder,
        },
        {
          provide: FakeSubcategoriesSeeder,
          useValue: fakeSubcategoriesSeeder,
        },
        {
          provide: FakeSuppliersSeeder,
          useValue: fakeSuppliersSeeder,
        },
        {
          provide: FakeTagsSeeder,
          useValue: fakeTagsSeeder,
        },
        {
          provide: FakeProductsSeeder,
          useValue: fakeProductsSeeder,
        },
      ],
    }).compile();

    service = module.get<BootstrapService>(BootstrapService);
  });

  afterEach(() => {
    process.env = originalEnv;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should run userSeeder when not in production (default)', async () => {
      delete process.env.IS_PRODUCTION;
      process.env.FAKE_DATA = 'true';

      await service.onModuleInit();

      expect(userSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeUsersSeeder.seed).toHaveBeenCalledTimes(1);
      expect(defaultStoreDetailsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeBrandsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeCategoriesSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeDiscountsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakePaymentMethodsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeProductsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeSubcategoriesSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeSuppliersSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeStoreDetailsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeTagsSeeder.seed).toHaveBeenCalledTimes(1);
    });

    it('should run both seeders in non-production environment', async () => {
      process.env.IS_PRODUCTION = 'false';
      process.env.NODE_ENV = 'development';
      process.env.FAKE_DATA = 'true';

      await service.onModuleInit();

      expect(userSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeUsersSeeder.seed).toHaveBeenCalledTimes(1);
      expect(defaultStoreDetailsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeBrandsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeCategoriesSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeDiscountsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakePaymentMethodsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeProductsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeSubcategoriesSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeSuppliersSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeStoreDetailsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeTagsSeeder.seed).toHaveBeenCalledTimes(1);
    });

    it('should run userSeeder and fakeUsersSeeder when RUN_SEEDS is true in production', async () => {
      process.env.IS_PRODUCTION = 'true';
      process.env.RUN_SEEDS = 'true';
      process.env.FAKE_DATA = 'true';

      await service.onModuleInit();

      expect(userSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeUsersSeeder.seed).toHaveBeenCalledTimes(1);
      expect(defaultStoreDetailsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeBrandsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeCategoriesSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeDiscountsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakePaymentMethodsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeProductsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeSubcategoriesSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeSuppliersSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeStoreDetailsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeTagsSeeder.seed).toHaveBeenCalledTimes(1);
    });

    it('should run userSeeder in production when RUN_SEEDS is true', async () => {
      process.env.IS_PRODUCTION = 'true';
      process.env.RUN_SEEDS = 'true';
      delete process.env.FAKE_DATA;

      await service.onModuleInit();

      expect(userSeeder.seed).toHaveBeenCalledTimes(1);
    });

    it('should NOT run userSeeder in production e2e when RUN_SEEDS is false', async () => {
      process.env.IS_PRODUCTION = 'true';
      process.env.RUN_SEEDS = 'false';
      process.env.NODE_ENV = 'e2e';

      await service.onModuleInit();

      expect(userSeeder.seed).not.toHaveBeenCalled();
    });

    it('should NOT run userSeeder in production e2e when RUN_SEEDS is undefined', async () => {
      process.env.IS_PRODUCTION = 'true';
      delete process.env.RUN_SEEDS;
      process.env.NODE_ENV = 'e2e';

      await service.onModuleInit();

      expect(userSeeder.seed).not.toHaveBeenCalled();
    });

    it('should run fakeUsersSeeder when FAKE_DATA is true in production', async () => {
      process.env.IS_PRODUCTION = 'true';
      process.env.FAKE_DATA = 'true';
      process.env.NODE_ENV = 'production';

      await service.onModuleInit();

      expect(fakeUsersSeeder.seed).toHaveBeenCalledTimes(1);
      expect(defaultStoreDetailsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeBrandsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeCategoriesSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeDiscountsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakePaymentMethodsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeProductsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeStoreDetailsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeSubcategoriesSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeSuppliersSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeTagsSeeder.seed).toHaveBeenCalledTimes(1);
    });

    it('should NOT run fakeUsersSeeder in production when FAKE_DATA is false', async () => {
      process.env.IS_PRODUCTION = 'true';
      process.env.FAKE_DATA = 'false';
      process.env.NODE_ENV = 'production';

      await service.onModuleInit();

      expect(fakeUsersSeeder.seed).not.toHaveBeenCalled();
      expect(fakeBrandsSeeder.seed).not.toHaveBeenCalled();
      expect(fakeCategoriesSeeder.seed).not.toHaveBeenCalled();
      expect(fakeDiscountsSeeder.seed).not.toHaveBeenCalled();
      expect(fakePaymentMethodsSeeder.seed).not.toHaveBeenCalled();
      expect(fakeProductsSeeder.seed).not.toHaveBeenCalled();
      expect(fakeStoreDetailsSeeder.seed).not.toHaveBeenCalled();
      expect(fakeSubcategoriesSeeder.seed).not.toHaveBeenCalled();
      expect(fakeSuppliersSeeder.seed).not.toHaveBeenCalled();
      expect(fakeTagsSeeder.seed).not.toHaveBeenCalled();
    });

    it('should NOT run fakeUsersSeeder in production when FAKE_DATA is undefined', async () => {
      process.env.IS_PRODUCTION = 'true';
      delete process.env.FAKE_DATA;
      process.env.NODE_ENV = 'production';

      await service.onModuleInit();

      expect(fakeUsersSeeder.seed).not.toHaveBeenCalled();
      expect(fakeBrandsSeeder.seed).not.toHaveBeenCalled();
      expect(fakeCategoriesSeeder.seed).not.toHaveBeenCalled();
      expect(fakeDiscountsSeeder.seed).not.toHaveBeenCalled();
      expect(fakePaymentMethodsSeeder.seed).not.toHaveBeenCalled();
      expect(fakeProductsSeeder.seed).not.toHaveBeenCalled();
      expect(fakeStoreDetailsSeeder.seed).not.toHaveBeenCalled();
      expect(fakeSubcategoriesSeeder.seed).not.toHaveBeenCalled();
      expect(fakeSuppliersSeeder.seed).not.toHaveBeenCalled();
      expect(fakeTagsSeeder.seed).not.toHaveBeenCalled();
    });

    it('should run seeds in e2e environment even without production', async () => {
      process.env.NODE_ENV = 'e2e';
      process.env.FAKE_DATA = 'true';

      await service.onModuleInit();

      expect(userSeeder.seed).toHaveBeenCalledTimes(1);
      expect(defaultStoreDetailsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeUsersSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeBrandsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeCategoriesSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeDiscountsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakePaymentMethodsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeProductsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeStoreDetailsSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeSubcategoriesSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeSuppliersSeeder.seed).toHaveBeenCalledTimes(1);
      expect(fakeTagsSeeder.seed).toHaveBeenCalledTimes(1);
    });

    it('should skip userSeeder in production for e2e when RUN_SEEDS not set', async () => {
      process.env.NODE_ENV = 'e2e';
      process.env.IS_PRODUCTION = 'true';
      delete process.env.RUN_SEEDS;

      await service.onModuleInit();

      expect(userSeeder.seed).not.toHaveBeenCalled();
    });

    it('should call seeders in sequence', async () => {
      userSeeder.seed.mockResolvedValue(undefined);
      fakeUsersSeeder.seed.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(userSeeder.seed).toHaveBeenCalled();
      expect(fakeUsersSeeder.seed).toHaveBeenCalled();
    });
  });
});
