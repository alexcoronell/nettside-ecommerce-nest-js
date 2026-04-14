/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { ProductSupplierService } from './product-supplier.service';

/* Entity */
import { ProductSupplier } from './entities/product-supplier.entity';
import { User } from '@user/entities/user.entity';

/* Faker */
import {
  generateProductSupplier,
  generateManyProductSuppliers,
} from '@faker/productSupplier.faker';
import { UpdateProductSupplierDto } from './dto/update-product-supplier.dto';

describe('ProductSupplierService', () => {
  let service: ProductSupplierService;
  let repository: Repository<ProductSupplier>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSupplierService,
        {
          provide: getRepositoryToken(ProductSupplier),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<ProductSupplierService>(ProductSupplierService);
    repository = module.get<Repository<ProductSupplier>>(
      getRepositoryToken(ProductSupplier),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count product suppliers services', () => {
    it('should return total all product suppliers', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);

      const { statusCode, total } = await service.countAll();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });
  });

  describe('find product suppliers services', () => {
    it('findAll should return all product suppliers with pagination', async () => {
      const mocks = generateManyProductSuppliers(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks.slice(0, 10), mocks.length]);

      const { statusCode, data, meta } = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { id: 'DESC' },
        relations: ['product', 'supplier', 'createdBy', 'updatedBy'],
        skip: 0,
        take: 10,
      });
      expect(statusCode).toBe(200);
      expect(meta.total).toEqual(mocks.length);
      expect(data).toEqual(mocks.slice(0, 10));
    });

    it('findOne should return a product supplier', async () => {
      const mock = generateProductSupplier();
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

    it('findOne should throw NotFoundException if product supplier does not exist', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(
          `The Product Supplier with id: ${id} not found`,
        );
      }
    });

    it('findOne should throw NotFoundException if product supplier does not exist with Rejects', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrowError(
        new NotFoundException(`The Product Supplier with id: ${id} not found`),
      );
    });

    it('findAllByProduct should return product suppliers', async () => {
      const mocks = generateManyProductSuppliers(10);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const { statusCode, data } = await service.findAllByProduct(1);
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(data).toEqual(mocks);
    });

    it('findAllByTag should return product suppliers', async () => {
      const mocks = generateManyProductSuppliers(10);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const { statusCode, data } = await service.findAllBySupplier(1);
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(data).toEqual(mocks);
    });
  });

  describe('create product tags service', () => {
    it('create should return a Product', async () => {
      const mock = generateProductSupplier();
      const dto = {
        ...mock,
        product: mock.product.id,
        supplier: mock.supplier.id,
      };
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'create').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, data } = await service.create(dto, userId);
      expect(statusCode).toBe(201);
      expect(data).toEqual(mock);
    });
  });

  describe('update product suppliers services', () => {
    it('update should return message: have been modified', async () => {
      const mock = generateProductSupplier();
      const id = mock.id;
      const userId: User['id'] = 1;
      const changes: UpdateProductSupplierDto = { costPrice: 100 };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest.spyOn(repository, 'merge').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, message } = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(
        `The Product Supplier with id: ${id} has been modified`,
      );
    });

    it('update should throw NotFoundException if Product does not exist', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.update(id, userId, { costPrice: 100 });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(
          `The Product Supplier with id: ${id} not found`,
        );
      }
    });
  });

  describe('remove produc suppliers services', () => {
    it('remove should return status and message', async () => {
      const mock = generateProductSupplier();
      const id = mock.id;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...mock, isDeleted: true });
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, message } = await service.remove(id, userId);
      expect(statusCode).toBe(200);
      expect(message).toEqual(
        `The Product Supplier with id: ${id} has been deleted`,
      );
    });

    it('remove should throw NotFoundException if Product Supplier does not exist with Rejects', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Product Supplier with id: ${id} not found`),
      );
    });
  });
});
