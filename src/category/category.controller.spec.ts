/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';

/* Controller */
import { CategoryController } from './category.controller';

/* Services */
import { CategoryService } from './category.service';

/* Entities */
import { Category } from './entities/category.entity';

/* DTO's */
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ResponseCategoryDto } from './dto/response-category.dto';

/* Faker */
import {
  createCategory,
  generateCategory,
  generateManyCategories,
} from '@faker/category.faker';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: CategoryService;

  const mockCategory: Category = generateCategory();
  const mockCategories: Category[] = generateManyCategories(10);
  const mockNewCategory: CreateCategoryDto = createCategory();

  const mockResponseCategory: ResponseCategoryDto = {
    id: 1,
    name: 'Test Category',
    slug: 'test-category',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
    deletedAt: null,
    deletedBy: null,
  };

  const mockService = {
    countAll: jest.fn().mockResolvedValue(mockCategories.length),
    count: jest
      .fn()
      .mockResolvedValue({ statusCode: 200, total: mockCategories.length }),
    findAll: jest.fn().mockResolvedValue({
      statusCode: 200,
      data: [mockResponseCategory],
      meta: { total: 1, page: 1, limit: 10 },
    }),
    findAllWithRelations: jest.fn().mockResolvedValue({
      statusCode: 200,
      data: [mockResponseCategory],
      meta: { total: 1, page: 1, limit: 10 },
    }),
    findOne: jest
      .fn()
      .mockResolvedValue({ statusCode: 200, data: mockResponseCategory }),
    findOneByName: jest
      .fn()
      .mockResolvedValue({ statusCode: 200, data: mockResponseCategory }),
    findOneBySlug: jest
      .fn()
      .mockResolvedValue({ statusCode: 200, data: mockResponseCategory }),
    create: jest.fn().mockResolvedValue({
      statusCode: 201,
      data: mockResponseCategory,
      message: 'Created',
    }),
    update: jest.fn().mockResolvedValue({
      statusCode: 200,
      data: mockResponseCategory,
      message: 'Updated',
    }),
    remove: jest
      .fn()
      .mockResolvedValue({ statusCode: 200, message: 'Deleted' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockService as unknown as CategoryService,
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Count category controllers', () => {
    it('should call count category service', async () => {
      const result = await controller.count();
      expect(result).toEqual({ statusCode: 200, total: mockCategories.length });
      expect(service.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('Find categories controllers', () => {
    it('should call findAll category service', async () => {
      const result = await controller.findAll();
      expect(result).toEqual({
        statusCode: 200,
        data: [mockResponseCategory],
        meta: { total: 1, page: 1, limit: 10 },
      });
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should call findOne category service', async () => {
      const result = await controller.findOne(1);
      expect(result).toEqual({ statusCode: 200, data: mockResponseCategory });
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return an category by slug', async () => {
      const result = await controller.findOneBySlug(mockCategory.slug);
      expect(result).toEqual({ statusCode: 200, data: mockResponseCategory });
      expect(service.findOneBySlug).toHaveBeenCalledTimes(1);
    });
  });

  describe('create category controller', () => {
    it('should call create category service', async () => {
      const userId = 1;
      const result = await controller.create(mockNewCategory, userId);
      expect(result).toEqual({
        statusCode: 201,
        data: mockResponseCategory,
        message: 'Created',
      });
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update category controller', () => {
    it('should call update category service', async () => {
      const id = 1;
      const userId = 1;
      const changes: UpdateCategoryDto = { name: 'newName' };
      await controller.update(id, changes, userId);
      expect(service.update).toHaveBeenCalledWith(id, userId, changes);
    });
  });

  describe('remove category controller', () => {
    it('shoudl call remove category service', async () => {
      const userId = 1;
      await controller.remove(1, userId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
