/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { ProductDiscountService } from './product-discount.service';

/* Entities */
import { ProductDiscount } from './entities/product-discount.entity';
import { User } from '@user/entities/user.entity';

/* Faker */
import {
  generateProductDiscount,
  generateManyProductDiscounts,
} from '@faker/productDiscount.faker';
import { CreateProductDiscountDto } from './dto/create-product-discount.dto';

describe('ProductDiscountService', () => {
  let service: ProductDiscountService;
  let repository: Repository<ProductDiscount>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductDiscountService,
        {
          provide: getRepositoryToken(ProductDiscount),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<ProductDiscountService>(ProductDiscountService);
    repository = module.get<Repository<ProductDiscount>>(
      getRepositoryToken(ProductDiscount),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count product discounts services', () => {
    it('should return total all product discounts', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);

      const { statusCode, total } = await service.count();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });
  });

  describe('find product discounts services', () => {
    it('findAll should return all product discoutns with pagination', async () => {
      const mocks = generateManyProductDiscounts(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks.slice(0, 10), mocks.length]);

      const { statusCode, data, meta } = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        relations: ['product', 'discount', 'createdBy'],
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(statusCode).toBe(200);
      expect(meta.total).toEqual(mocks.length);
      expect(data).toEqual(mocks.slice(0, 10));
    });

    it('findOne should return a product discount by criteria', async () => {
      const mockProductDiscount = generateProductDiscount();
      const productId = mockProductDiscount.productId;
      const discountId = mockProductDiscount.discountId;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockProductDiscount);

      const result = await service.findOne(productId, discountId);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { productId, discountId },
      });
      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(mockProductDiscount);
    });

    it('findOne should throw NotFoundException if product discount does not exist', async () => {
      const productId = 999;
      const discountId = 999;

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(productId, discountId)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { productId, discountId },
      });
    });

    it('findAllByProduct should return product discounts by product id', async () => {
      const mocks = generateManyProductDiscounts(10);
      const productId = mocks[0].productId;

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const { statusCode, data, total } =
        await service.findAllByProduct(productId);
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        relations: ['product', 'discount'],
        where: { product: { id: productId } },
      });
      expect(statusCode).toBe(200);
      expect(total).toEqual(mocks.length);
      expect(data).toEqual(mocks);
    });

    it('findAllByDiscount should return product discounts by discount id', async () => {
      const mocks = generateManyProductDiscounts(10);
      const discountId = mocks[0].discountId;

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const { statusCode, data, total } =
        await service.findAllByDiscount(discountId);
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        relations: ['product', 'discount'],
        where: { discount: { id: discountId } },
      });
      expect(statusCode).toBe(200);
      expect(total).toEqual(mocks.length);
      expect(data).toEqual(mocks);
    });
  });

  describe('create product discount services', () => {
    it('should create a new product discount', async () => {
      const mock = generateProductDiscount();
      const userId: User['id'] = 1;
      const dto: CreateProductDiscountDto = {
        ...mock,
        product: mock.product.id,
        discount: mock.discount.id,
      };

      jest.spyOn(repository, 'create').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode } = await service.create(dto, userId);

      expect(repository.create).toHaveBeenCalledTimes(1);
      //expect(repository.create).toHaveBeenCalledWith(mock);
      expect(repository.save).toHaveBeenCalledTimes(1);
      //expect(repository.save).toHaveBeenCalledWith(dto);
      expect(statusCode).toBe(201);
      //expect(data).toEqual(mock);
    });

    it('should create multiple product discounts when array is provided', async () => {
      const mocks = generateManyProductDiscounts(3);
      const userId: User['id'] = 1;
      const dtos = mocks.map((mock) => ({
        ...mock,
        product: mock.product.id,
        discount: mock.discount.id,
      }));

      jest.spyOn(repository, 'create').mockReturnValue(dtos as any);
      jest.spyOn(repository, 'save').mockResolvedValue(dtos as any);

      const { statusCode } = await service.createMany(dtos, userId);

      expect(repository.create).toHaveBeenCalledTimes(1);
      //expect(repository.create).toHaveBeenCalledWith(mocks);
      expect(repository.save).toHaveBeenCalledTimes(1);
      //expect(repository.save).toHaveBeenCalledWith(mocks);
      expect(statusCode).toBe(201);
      //expect(data).toEqual(mocks);
    });

    it('should create a single product discount when object is provided to createMany', async () => {
      const mock: ProductDiscount[] = generateManyProductDiscounts(1);
      const userId: User['id'] = 1;
      const dtos: CreateProductDiscountDto[] = [
        {
          ...mock,
          product: mock[0].product.id,
          discount: mock[0].discount.id,
        },
      ];

      jest.spyOn(repository, 'create').mockReturnValue([dtos] as any);
      jest.spyOn(repository, 'save').mockResolvedValue([dtos] as any);

      const { statusCode } = await service.createMany(dtos, userId);
      expect(repository.create).toHaveBeenCalledTimes(1);
      //expect(repository.create).toHaveBeenCalledWith([dto]);
      expect(repository.save).toHaveBeenCalledTimes(1);
      //expect(repository.save).toHaveBeenCalledWith([mock]);
      expect(statusCode).toBe(201);
      //expect(data).toEqual(mock);
    });

    xit('create should return ConflictException when product discount already exists', async () => {
      const mock = generateProductDiscount();
      const userId: User['id'] = 1;
      const dto = {
        ...mock,
        product: mock.product.id,
        discount: mock.discount.id,
      };

      jest.spyOn(repository, 'create').mockReturnValue(mock);
      // Simulate TypeORM throwing a duplicate error (e.g., unique constraint violation)
      jest.spyOn(repository, 'save').mockRejectedValue(mock);

      try {
        await service.create(dto, userId);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toContain('The Product Discount already exists');
      }
    });

    it('should throw an error when trying to create a product discount that already exists', async () => {
      const mock = generateProductDiscount();
      const userId: User['id'] = 1;
      const dto = {
        ...mock,
        product: mock.product.id,
        discount: mock.discount.id,
      };

      // Simulate that the product discount already exists in the DB
      jest.spyOn(repository, 'create').mockReturnValue(mock);
      // Simulate TypeORM throwing a duplicate error (e.g., unique constraint violation)
      jest.spyOn(repository, 'save').mockRejectedValue({
        code: '23505', // Postgres unique violation
        detail:
          'The Product Discount with (product_id, discount_id) already exists.',
      });

      await expect(service.create(dto, userId)).rejects.toMatchObject({
        code: '23505',
      });

      expect(repository.create).toHaveBeenCalledTimes(1);
      //expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledTimes(1);
      //expect(repository.save).toHaveBeenCalledWith(mock);
    });
  });

  describe('delete product discount services', () => {
    it('should delete a product discount by criteria', async () => {
      const mock = generateProductDiscount();
      const productId = 1;
      const discountId = 2;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest
        .spyOn(repository, 'delete')
        .mockResolvedValue({ affected: 1 } as any);

      const result = await service.delete(productId, discountId);

      expect(repository.delete).toHaveBeenCalledTimes(1);
      expect(repository.delete).toHaveBeenCalledWith({
        product: { id: productId },
        discount: { id: discountId },
      });
      expect(result.statusCode).toBe(200);
      expect(result.message).toContain('deleted successfully');
    });

    it('should throw NotFoundException if no product discount matches criteria', async () => {
      const productId = 999;
      const discountId = 888;

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(repository, 'delete')
        .mockResolvedValue({ affected: 0 } as any);

      await expect(service.delete(productId, discountId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
