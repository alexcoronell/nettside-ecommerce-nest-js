/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { ProductTagService } from '@product_tag/product-tag.service';

/* Entity */
import { ProductTag } from '@product_tag/entities/product-tag.entity';
import { Product } from '@product/entities/product.entity';
import { Tag } from '@tag/entities/tag.entity';
import { User } from '@user/entities/user.entity';

/* Faker */
import {
  createProductTag,
  generateProductTag,
  generateManyProductTags,
} from '@faker/productTag.faker';

describe('ProductTagService', () => {
  let service: ProductTagService;
  let repository: Repository<ProductTag>;
  let productRepository: Repository<Product>;
  let tagRepository: Repository<Tag>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductTagService,
        {
          provide: getRepositoryToken(ProductTag),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Product),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Tag),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<ProductTagService>(ProductTagService);
    repository = module.get<Repository<ProductTag>>(
      getRepositoryToken(ProductTag),
    );
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    tagRepository = module.get<Repository<Tag>>(getRepositoryToken(Tag));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count products tags services', () => {
    it('should return total all products tags', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);

      const { statusCode, total } = await service.countAll();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });
  });

  describe('find products tags services', () => {
    it('findAll should return all product tags', async () => {
      const mocks = generateManyProductTags(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const { statusCode, data, total } = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith();
      expect(statusCode).toBe(200);
      expect(total).toEqual(mocks.length);
      expect(data).toEqual(mocks);
    });

    it('findOne should return a product tag', async () => {
      const mock = generateProductTag();
      const productTag = { productId: 1, tagId: 1 };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);

      const { statusCode, data } = await service.findOne(productTag);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: productTag,
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(mock);
    });

    it('findOne should throw NotFoundException if  tags does not exist', async () => {
      const productTag = { productId: 1, tagId: 1 };
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(productTag);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(
          `The Product Tag with productId: ${productTag.productId} and tagId: ${productTag.tagId} not found`,
        );
      }
    });

    it('findOne should throw NotFoundException if product tag does not exist with Rejects', async () => {
      const productTag = { productId: 99, tagId: 99 };
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(productTag)).rejects.toThrowError(
        new NotFoundException(
          `The Product Tag with productId: ${productTag.productId} and tagId: ${productTag.tagId} not found`,
        ),
      );
    });

    it('findAllByProduct should return products tags', async () => {
      const mocks = generateManyProductTags(10);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const { statusCode, data } = await service.findAllByProduct(1);
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(data).toEqual(mocks);
    });

    it('findAllByTag should return products tags', async () => {
      const mocks = generateManyProductTags(10);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const { statusCode, data } = await service.findAllByTag(1);
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(data).toEqual(mocks);
    });
  });

  describe('create product tags service', () => {
    it('should create a single product tag', async () => {
      const dto = createProductTag();
      const userId: User['id'] = 1;
      const createdMock = { id: 1, ...dto };

      jest
        .spyOn(productRepository, 'findOne')
        .mockResolvedValue({ id: dto.product } as Product);
      jest
        .spyOn(tagRepository, 'findOne')
        .mockResolvedValue({ id: dto.tag } as Tag);
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(repository, 'create')
        .mockReturnValue([createdMock] as unknown as ProductTag);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(createdMock as unknown as ProductTag);

      const result = await service.create(dto, userId);

      expect(result.statusCode).toBe(201);
      expect(result.data).toEqual([createdMock]);
      expect(result.message).toBe('The Product Tag was created');
    });

    it('should create multiple product tags', async () => {
      const dtos = [createProductTag(), createProductTag()];
      const createdMocks = [
        { id: 1, ...dtos[0] },
        { id: 2, ...dtos[1] },
      ];
      const userId: User['id'] = 1;

      jest
        .spyOn(productRepository, 'findOne')
        .mockResolvedValue({ id: 1 } as Product);
      jest.spyOn(tagRepository, 'findOne').mockResolvedValue({ id: 1 } as Tag);
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(repository, 'create')
        .mockReturnValue(createdMocks as unknown as ProductTag);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue(createdMocks as unknown as ProductTag);

      const result = await service.createMany(dtos, userId);

      expect(result.statusCode).toBe(201);
      expect(result.data).toEqual(createdMocks);
      expect(result.message).toBe('The Product Tags were created');
    });
  });

  describe('remove product tag service', () => {
    it('should remove a product tag successfully', async () => {
      const mock = generateProductTag();
      const productTag = { productId: 1, tagId: 1 };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest
        .spyOn(repository, 'delete')
        .mockResolvedValue({ affected: 1 } as any);

      const result = await service.delete(productTag);

      expect(repository.findOne).toHaveBeenCalledWith({ where: productTag });
      expect(repository.delete).toHaveBeenCalledWith(productTag);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe(`The Product Tag has been deleted`);
    });

    it('should throw NotFoundException if product tag does not exist', async () => {
      const productTag = { productId: 99, tagId: 99 };
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.delete(productTag)).rejects.toThrowError(
        new NotFoundException(`The Product Tag not found`),
      );
      expect(repository.findOne).toHaveBeenCalledWith({ where: productTag });
    });
  });
});
