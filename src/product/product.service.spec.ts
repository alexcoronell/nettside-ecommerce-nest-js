/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { ProductService } from './product.service';

/* Entity */
import { Product } from './entities/product.entity';

/* DTO's */
import { UpdateProductDto } from './dto/update-product.dto';

/* Faker */
import { generateProduct, generateManyProducts } from '@faker/product.faker';
import { User } from '@user/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';

describe('ProductService', () => {
  let service: ProductService;
  let repository: Repository<Product>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<ProductService>(ProductService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count products services', () => {
    it('should return total all products', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);

      const { statusCode, total } = await service.countAll();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });

    it('should return total products not removed', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);
      const { statusCode, total } = await service.count();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(repository.count).toHaveBeenCalledWith({
        where: { isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });
  });

  describe('find products services', () => {
    it('findAll should return all products with pagination', async () => {
      const mocks = generateManyProducts(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks.slice(0, 10), mocks.length]);

      const { statusCode, data, meta } = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { name: 'ASC' },
        relations: [
          'createdBy',
          'updatedBy',
          'brand',
          'category',
          'subcategory',
        ],
        skip: 0,
        take: 10,
      });
      expect(statusCode).toBe(200);
      expect(meta.total).toEqual(mocks.length);
      expect(data).toEqual(mocks.slice(0, 10));
    });

    it('findOne should return a products', async () => {
      const mock = generateProduct();
      const id = mock.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);

      const { statusCode, data } = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { id, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(mock);
    });

    it('findOne should throw NotFoundException if products does not exist', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Product with ID: ${id} not found`);
      }
    });

    it('findOne should throw NotFoundException if product does not exist with Rejects', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrowError(
        new NotFoundException(`The Product with ID: ${id} not found`),
      );
    });

    it('findOneByName should return a products', async () => {
      const mock = generateProduct();
      const name = mock.name;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);

      const { statusCode, data } = await service.findOneByName(name);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(data).toEqual(mock);
    });

    it('findOneByName should throw NotFoundException if Product does not exist', async () => {
      const name = 'nameTest';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOneByName(name);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Product with NAME: ${name} not found`);
      }
    });

    it('findByBrand should return products by brand', async () => {
      const mocks = generateManyProducts(50);
      const brandSlug = 'brand-test';

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const { statusCode, data, total } = await service.findByBrand(brandSlug);
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        relations: ['brand', 'category', 'subcategory'],
        where: { brand: { slug: brandSlug }, isDeleted: false },
        order: { name: 'ASC' },
      });
      expect(statusCode).toBe(200);
      expect(total).toEqual(mocks.length);
      expect(data).toEqual(mocks);
    });

    it('findByCategory should return products by category', async () => {
      const mocks = generateManyProducts(50);
      const categorySlug = 'test-category';

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const { statusCode, data, total } =
        await service.findByCategory(categorySlug);
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        relations: ['brand', 'category', 'subcategory'],
        where: { category: { slug: categorySlug }, isDeleted: false },
        order: { name: 'ASC' },
      });
      expect(statusCode).toBe(200);
      expect(total).toEqual(mocks.length);
      expect(data).toEqual(mocks);
    });

    it('findBySubcategory should return products by subcategory', async () => {
      const mocks = generateManyProducts(50);
      const subcategoryId = 1;

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const { statusCode, data, total } =
        await service.findBySubcategory(subcategoryId);
      expect(repository.findAndCount).toHaveBeenCalledTimes(subcategoryId);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { subcategory: { id: subcategoryId }, isDeleted: false },
        order: { name: 'ASC' },
      });
      expect(statusCode).toBe(200);
      expect(total).toEqual(mocks.length);
      expect(data).toEqual(mocks);
    });
  });

  describe('create products services', () => {
    it('create should return a Product', async () => {
      const mock = generateProduct();
      const userId: User['id'] = 1;
      const dto: CreateProductDto = {
        ...mock,
        category: mock.category.id,
        subcategory: mock.subcategory.id,
        brand: mock.brand.id,
      };

      jest.spyOn(repository, 'create').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, data } = await service.create(dto, userId);
      expect(statusCode).toBe(201);
      expect(data).toEqual(mock);
    });

    it('create should return Conflict Exception when name Product exists', async () => {
      const mock = generateProduct();
      const userId: User['id'] = 1;
      const dto: CreateProductDto = {
        ...mock,
        category: mock.category.id,
        subcategory: mock.subcategory.id,
        brand: mock.brand.id,
      };

      jest.spyOn(repository, 'create').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      try {
        await service.create(dto, userId);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(`Product ${mock.name} already exists`);
      }
    });
  });

  describe('update products services', () => {
    it('update should return message: have been modified', async () => {
      const mock = generateProduct();
      const id = mock.id;
      const userId: User['id'] = 1;
      const changes: UpdateProductDto = { name: 'new-name' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest.spyOn(repository, 'merge').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, message } = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Product with ID: ${id} has been modified`);
    });

    it('update should throw NotFoundException if Product does not exist', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.update(id, userId, { name: 'newName' });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Product with ID: ${id} not found`);
      }
    });
  });

  describe('remove producs services', () => {
    it('remove should return status and message', async () => {
      const mock = generateProduct();
      const id = mock.id;
      const userId: User['id'] = 1;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...mock, isDeleted: true });
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, message } = await service.remove(id, userId);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Product with ID: ${id} has been deleted`);
    });

    it('remove should throw NotFoundException if Product does not exist with Rejects', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Product with ID: ${id} not found`),
      );
    });
  });
});
