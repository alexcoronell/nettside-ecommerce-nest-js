import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PurchaseDetailModule } from './purchase-detail.module';
import { PurchaseDetailService } from './purchase-detail.service';
import { PurchaseDetail } from './entities/purchase-detail.entity';

/**
 * PurchaseDetailModule tests - internal module without controller
 */
describe('PurchaseDetailModule', () => {
  let module: TestingModule;
  let service: PurchaseDetailService;
  let repository: Repository<PurchaseDetail>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PurchaseDetailModule],
    })
      .overrideProvider(getRepositoryToken(PurchaseDetail))
      .useValue({
        findOne: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        delete: jest.fn(),
      })
      .compile();

    service = module.get<PurchaseDetailService>(PurchaseDetailService);
    repository = module.get<Repository<PurchaseDetail>>(
      getRepositoryToken(PurchaseDetail),
    );
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  it('should have PurchaseDetailService only (no controller)', () => {
    expect(module.get(PurchaseDetailService)).toBeInstanceOf(
      PurchaseDetailService,
    );
  });

  it('should inject TypeORM repository for PurchaseDetail', () => {
    expect(module.get(getRepositoryToken(PurchaseDetail))).toBeDefined();
  });
});
