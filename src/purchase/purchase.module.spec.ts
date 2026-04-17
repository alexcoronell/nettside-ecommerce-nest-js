import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PurchaseModule } from './purchase.module';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { Purchase } from './entities/purchase.entity';
import { PurchaseDetail } from '@purchase_detail/entities/purchase-detail.entity';

describe('PurchaseModule', () => {
  let module: TestingModule;
  let service: PurchaseService;
  let controller: PurchaseController;
  let repository: Repository<Purchase>;
  let detailRepository: Repository<PurchaseDetail>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PurchaseModule],
    })
      .overrideProvider(getRepositoryToken(Purchase))
      .useValue({
        findOne: jest.fn(),
        save: jest.fn(),
        findAndCount: jest.fn(),
        create: jest.fn(),
        merge: jest.fn(),
      })
      .overrideProvider(getRepositoryToken(PurchaseDetail))
      .useValue({
        findOne: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
      })
      .compile();

    service = module.get<PurchaseService>(PurchaseService);
    controller = module.get<PurchaseController>(PurchaseController);
    repository = module.get<Repository<Purchase>>(getRepositoryToken(Purchase));
    detailRepository = module.get<Repository<PurchaseDetail>>(
      getRepositoryToken(PurchaseDetail),
    );
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
    expect(repository).toBeDefined();
    expect(detailRepository).toBeDefined();
  });

  it('should have PurchaseService and PurchaseController', () => {
    expect(module.get(PurchaseService)).toBeInstanceOf(PurchaseService);
    expect(module.get(PurchaseController)).toBeInstanceOf(PurchaseController);
  });

  it('should inject TypeORM repositories for Purchase and PurchaseDetail', () => {
    expect(module.get(getRepositoryToken(Purchase))).toBeDefined();
    expect(module.get(getRepositoryToken(PurchaseDetail))).toBeDefined();
  });
});
