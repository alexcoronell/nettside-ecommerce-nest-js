/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';

/* Controller */
import { DiscountController } from './discount.controller';

/* Services */
import { DiscountService } from './discount.service';

/* Entities */
import { Discount } from './entities/discount.entity';

/* DTO's */
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

/* Faker */
import {
  createDiscount,
  generateDiscount,
  generateManyDiscounts,
} from '@faker/discount.faker';

describe('DiscountController', () => {
  let controller: DiscountController;
  let service: DiscountService;

  const mockDiscount: Discount = generateDiscount();
  const mockDiscounts: Discount[] = generateManyDiscounts(10);
  const mockNewDiscount: CreateDiscountDto = createDiscount();

  const countResponse = {
    statusCode: HttpStatus.OK,
    total: mockDiscounts.length,
  };
  const findAllResponse = {
    statusCode: HttpStatus.OK,
    data: mockDiscounts,
    meta: { total: mockDiscounts.length, page: 1, limit: 10, totalPages: 1 },
  };
  const findOneResponse = { statusCode: HttpStatus.OK, data: mockDiscount };
  const createResponse = {
    statusCode: HttpStatus.CREATED,
    data: mockDiscount,
    message: 'The Discount was created',
  };
  const updateResponse = {
    statusCode: HttpStatus.OK,
    data: mockDiscount,
    message: 'The Discount with ID: 1 has been modified',
  };
  const removeResponse = {
    statusCode: HttpStatus.OK,
    message: 'The Discount with ID: 1 has been deleted',
  };

  const mockService = {
    count: jest.fn().mockResolvedValue(countResponse),
    findAll: jest.fn().mockResolvedValue(findAllResponse),
    findOne: jest.fn().mockResolvedValue(findOneResponse),
    create: jest.fn().mockResolvedValue(createResponse),
    update: jest.fn().mockResolvedValue(updateResponse),
    remove: jest.fn().mockResolvedValue(removeResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscountController],
      providers: [
        {
          provide: DiscountService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DiscountController>(DiscountController);
    service = module.get<DiscountService>(DiscountService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('count', () => {
    it('should return total count of discounts', async () => {
      const result = await controller.count();
      expect(result).toEqual(countResponse);
      expect(service.count).toHaveBeenCalledTimes(1);
    });

    it('should call count service without parameters', async () => {
      await controller.count();
      expect(service.count).toHaveBeenCalledWith();
    });
  });

  describe('findAll', () => {
    it('should return all discounts without pagination', async () => {
      const result = await controller.findAll();
      expect(result).toEqual(findAllResponse);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return all discounts with pagination params', async () => {
      const paginationDto = { page: 2, limit: 5 };
      await controller.findAll(paginationDto);
      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
    });

    it('should return all discounts with search param', async () => {
      const paginationDto = { search: 'DISCOUNT' };
      await controller.findAll(paginationDto);
      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
    });

    it('should return all discounts with sort params', async () => {
      const paginationDto = { sortBy: 'code', sortOrder: 'DESC' as const };
      await controller.findAll(paginationDto);
      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
    });
  });

  describe('findOne', () => {
    it('should return a discount by id', async () => {
      const id = 1;
      const result = await controller.findOne(id);
      expect(result).toEqual(findOneResponse);
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });

    it('should pass id as number to service', async () => {
      await controller.findOne(5);
      expect(service.findOne).toHaveBeenCalledWith(5);
    });
  });

  describe('create', () => {
    it('should create a new discount', async () => {
      const userId = 1;
      const result = await controller.create(mockNewDiscount, userId);
      expect(result).toEqual(createResponse);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith(mockNewDiscount, userId);
    });

    it('should pass userId to service', async () => {
      const userId = 42;
      await controller.create(mockNewDiscount, userId);
      expect(service.create).toHaveBeenCalledWith(mockNewDiscount, userId);
    });
  });

  describe('update', () => {
    it('should update a discount', async () => {
      const id = 1;
      const userId = 1;
      const changes: UpdateDiscountDto = { code: 'newCode' };
      const result = await controller.update(id, changes, userId);
      expect(result).toEqual(updateResponse);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(service.update).toHaveBeenCalledWith(id, userId, changes);
    });

    it('should pass id and userId to service', async () => {
      const id = 5;
      const userId = 3;
      const changes: UpdateDiscountDto = { description: 'Updated description' };
      await controller.update(id, changes, userId);
      expect(service.update).toHaveBeenCalledWith(id, userId, changes);
    });
  });

  describe('remove', () => {
    it('should remove a discount', async () => {
      const id = 1;
      const userId = 1;
      const result = await controller.remove(id, userId);
      expect(result).toEqual(removeResponse);
      expect(service.remove).toHaveBeenCalledTimes(1);
      expect(service.remove).toHaveBeenCalledWith(id, userId);
    });

    it('should pass id and userId to service for deletion', async () => {
      const id = 7;
      const userId = 2;
      await controller.remove(id, userId);
      expect(service.remove).toHaveBeenCalledWith(id, userId);
    });
  });
});
