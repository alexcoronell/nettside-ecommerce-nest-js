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

  const mockService = {
    countAll: jest.fn().mockResolvedValue(mockCategories.length),
    count: jest.fn().mockResolvedValue(mockCategories.length),
    findAll: jest.fn().mockResolvedValue(mockCategories),
    findAllWithRelations: jest.fn().mockResolvedValue(mockCategories),
    findOne: jest.fn().mockResolvedValue(mockCategory),
    findOneByName: jest.fn().mockResolvedValue(mockCategory),
    findOneBySlug: jest.fn().mockResolvedValue(mockCategory),
    create: jest.fn().mockResolvedValue(mockNewCategory),
    update: jest.fn().mockResolvedValue(1),
    remove: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockService,
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
      expect(await controller.count()).toBe(mockCategories.length);
      expect(service.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('Find categories controllers', () => {
    it('should call findAll category service', async () => {
      expect(await controller.findAll()).toBe(mockCategories);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should call findOne category service', async () => {
      expect(await controller.findOne(1)).toBe(mockCategory);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return an category by slug', async () => {
      expect(await controller.findOneBySlug(mockCategory.slug));
      expect(service.findOneBySlug).toHaveBeenCalledTimes(1);
    });
  });

  describe('create category controller', () => {
    it('should call create category service', async () => {
      const userId = 1;
      await controller.create(mockNewCategory, userId);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update category controller', () => {
    it('should call update category service', async () => {
      const userId = 1;
      const changes = { name: 'newName' };
      await controller.update(1, userId, changes);
      expect(service.update).toHaveBeenCalledTimes(1);
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
