import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProductTagModule } from './product-tag.module';
import { ProductTagService } from './product-tag.service';
import { ProductTagController } from './product-tag.controller';
import { ProductTag } from './entities/product-tag.entity';
import { Product } from '@product/entities/product.entity';
import { Tag } from '@tag/entities/tag.entity';

describe('ProductTag module', () => {
  let module: TestingModule;
  let service: ProductTagService;
  let controller: ProductTagController;
  let repository: Repository<ProductTag>;
  let productRepository: Repository<Product>;
  let tagRepository: Repository<Tag>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ProductTagModule],
    })
      .overrideProvider(getRepositoryToken(ProductTag))
      .useValue({
        findOne: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        delete: jest.fn(),
        findAndCount: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      })
      .overrideProvider(getRepositoryToken(Product))
      .useValue({
        findOne: jest.fn(),
      })
      .overrideProvider(getRepositoryToken(Tag))
      .useValue({
        findOne: jest.fn(),
      })
      .compile();

    service = module.get<ProductTagService>(ProductTagService);
    controller = module.get<ProductTagController>(ProductTagController);
    repository = module.get<Repository<ProductTag>>(
      getRepositoryToken(ProductTag),
    );
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    tagRepository = module.get<Repository<Tag>>(getRepositoryToken(Tag));
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
    expect(repository).toBeDefined();
    expect(productRepository).toBeDefined();
    expect(tagRepository).toBeDefined();
  });

  it('should have ProductTagService and ProductTagController', () => {
    expect(module.get(ProductTagService)).toBeInstanceOf(ProductTagService);
    expect(module.get(ProductTagController)).toBeInstanceOf(
      ProductTagController,
    );
  });

  it('should inject TypeORM repository for ProductTag', () => {
    expect(module.get(getRepositoryToken(ProductTag))).toBeDefined();
  });
});
