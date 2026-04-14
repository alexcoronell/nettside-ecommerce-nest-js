/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';

/* Controller */
import { SubcategoryController } from './subcategory.controller';

/* Services */
import { SubcategoryService } from './subcategory.service';

/* Entities */
import { Subcategory } from './entities/subcategory.entity';

/* DTO's */
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';

/* Faker */
import {
  createSubcategory,
  generateSubcategory,
  generateManySubcategories,
} from '@faker/subcategory.faker';

describe('SubcategoryController', () => {
  let controller: SubcategoryController;
  let service: SubcategoryService;

  const mockSubcategory: Subcategory = generateSubcategory();
  const mockSubcategories: Subcategory[] = generateManySubcategories(10);
  const mockNewSubcategory: CreateSubcategoryDto = createSubcategory();

  const mockService = {
    count: jest.fn().mockResolvedValue(mockSubcategories.length),
    findAll: jest.fn().mockResolvedValue(mockSubcategories),
    findAllByCategory: jest.fn().mockResolvedValue(mockSubcategories),
    findOne: jest.fn().mockResolvedValue(mockSubcategory),
    findOneBySlug: jest.fn().mockResolvedValue(mockSubcategory),
    create: jest.fn().mockResolvedValue(mockNewSubcategory),
    update: jest.fn().mockResolvedValue(1),
    remove: jest.fn().mockResolvedValue(1),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubcategoryController],
      providers: [
        {
          provide: SubcategoryService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SubcategoryController>(SubcategoryController);
    service = module.get<SubcategoryService>(SubcategoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Count subcategory controllers', () => {
    it('should call count subcategory service', async () => {
      expect(await controller.count()).toBe(mockSubcategories.length);
      expect(service.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('Find subcategories controllers', () => {
    it('should call findAll subcategory service', async () => {
      expect(await controller.findAll()).toBe(mockSubcategories);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should call findAllByCategory subcategory service', async () => {
      expect(await controller.findAllByCategory(mockSubcategory.id)).toBe(
        mockSubcategories,
      );
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should call findOne subcategory service', async () => {
      expect(await controller.findOne(1)).toBe(mockSubcategory);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return an subcategory by slug', async () => {
      expect(await controller.findOneBySlug(mockSubcategory.slug));
      expect(service.findOneBySlug).toHaveBeenCalledTimes(1);
    });
  });

  describe('create subcategory controller', () => {
    it('should call create subcategory service', async () => {
      const userId = 1;
      await controller.create(mockNewSubcategory, userId);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update subcategory controller', () => {
    it('should call update subcategory service', async () => {
      const changes = { name: 'newName' };
      const userId = 1;
      await controller.update(1, userId, changes);
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove subcategory controller', () => {
    it('shoudl call remove subcategory service', async () => {
      const userId = 1;
      await controller.remove(1, userId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
