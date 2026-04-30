/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';

/* Controller */
import { ProductController } from './product.controller';

/* Services */
import { ProductService } from './product.service';

/* Entities */
import { Product } from './entities/product.entity';

/* DTO's */
import { CreateProductDto } from './dto/create-product.dto';

/* Faker */
import {
  createProduct,
  generateProduct,
  generateManyProducts,
} from '@faker/product.faker';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  const mockProduct: Product = generateProduct();
  const mockProducts: Product[] = generateManyProducts(10);
  const mockNewProduct: CreateProductDto = createProduct();

  const mockService = {
    countAll: jest
      .fn()
      .mockResolvedValue({ statusCode: 200, total: mockProducts.length }),
    count: jest
      .fn()
      .mockResolvedValue({ statusCode: 200, total: mockProducts.length }),
    findAll: jest.fn().mockResolvedValue({
      statusCode: 200,
      data: mockProducts,
      total: mockProducts.length,
    }),
    findOne: jest
      .fn()
      .mockResolvedValue({ statusCode: 200, data: mockProduct }),
    findOneBySlug: jest
      .fn()
      .mockResolvedValue({ statusCode: 200, data: mockProduct }),
    create: jest
      .fn()
      .mockResolvedValue({ statusCode: 201, data: mockNewProduct }),
    update: jest
      .fn()
      .mockResolvedValue({ statusCode: 200, message: 'updated' }),
    remove: jest
      .fn()
      .mockResolvedValue({ statusCode: 200, message: 'deleted' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Count products controllers', () => {
    it('should call count product service', async () => {
      expect(await controller.count()).toEqual({
        statusCode: 200,
        total: mockProducts.length,
      });
      expect(service.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('Find products controllers', () => {
    it('should call findAll product service', async () => {
      expect(await controller.findAll()).toEqual({
        statusCode: 200,
        data: mockProducts,
        total: mockProducts.length,
      });
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should call findOne product service', async () => {
      expect(await controller.findOne(1)).toEqual({
        statusCode: 200,
        data: mockProduct,
      });
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return an product by slug', async () => {
      expect(await controller.findOneBySlug(mockProduct.slug));
      expect(service.findOneBySlug).toHaveBeenCalledTimes(1);
    });
  });

  describe('create products controller', () => {
    it('should call create shipping company service', async () => {
      const userId = 1;
      await controller.create(mockNewProduct, userId);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update products controller', () => {
    it('should call update products service', async () => {
      const userId = 1;
      const changes = { name: 'newName' };
      await controller.update(1, userId, changes);
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove products controller', () => {
    it('shoudl call remove products service', async () => {
      const userId = 1;
      await controller.remove(1, userId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
