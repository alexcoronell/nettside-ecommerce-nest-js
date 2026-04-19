import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SaleModule } from './sale.module';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { Sale } from './entities/sale.entity';
import { SaleDetail } from '@sale_detail/entities/sale-detail.entity';

describe('Category module', () => {
  let module: TestingModule;
  let service: SaleService;
  let controller: SaleController;
  let repository: Repository<Sale>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [SaleModule],
    })
      .overrideProvider(getRepositoryToken(Sale))
      .useValue({
        findOne: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findAndCount: jest.fn(),
        create: jest.fn(),
        merge: jest.fn(),
        delete: jest.fn(),
      })
      .overrideProvider(getRepositoryToken(SaleDetail))
      .useValue({
        create: jest.fn(),
        save: jest.fn(),
        findAndCount: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
      })
      .compile();

    service = module.get<SaleService>(SaleService);
    controller = module.get<SaleController>(SaleController);
    repository = module.get<Repository<Sale>>(getRepositoryToken(Sale));
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
    expect(repository).toBeDefined();
  });

  it('should have SaleService and SaleController', () => {
    expect(module.get(SaleService)).toBeInstanceOf(SaleService);
    expect(module.get(SaleController)).toBeInstanceOf(SaleController);
  });

  it('should inject TypeORM repository for Sale', () => {
    expect(module.get(getRepositoryToken(Sale))).toBeDefined();
  });
});
