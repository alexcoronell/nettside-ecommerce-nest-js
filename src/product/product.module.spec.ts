import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProductModule } from './product.module';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';

describe('Product module', () => {
  let module: TestingModule;
  let service: ProductService;
  let controller: ProductController;
  let repository: Repository<Product>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ProductModule],
    })
      .overrideProvider(getRepositoryToken(Product))
      .useValue({
        findOne: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        delete: jest.fn(),
      })
      .compile();

    service = module.get<ProductService>(ProductService);
    controller = module.get<ProductController>(ProductController);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
    expect(repository).toBeDefined();
  });

  it('should have ProductService and ProductController', () => {
    expect(module.get(ProductService)).toBeInstanceOf(ProductService);
    expect(module.get(ProductController)).toBeInstanceOf(ProductController);
  });

  it('should inject TypeORM repository for Product', () => {
    expect(module.get(getRepositoryToken(Product))).toBeDefined();
  });
});
