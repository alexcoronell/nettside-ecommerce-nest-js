/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';

/* Controller */
import { SubcategoryController } from './subcategory.controller';

/* Services */
import { SubcategoryService } from './subcategory.service';

/* DTO's */
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { ResponseSubcategoryDto } from './dto/response-subcategory.dto';

/* Faker */
import {
  createSubcategory,
  generateManySubcategories,
} from '@faker/subcategory.faker';

describe('SubcategoryController', () => {
  let controller: SubcategoryController;
  let service: SubcategoryService;

  const mockResponseSubcategory: ResponseSubcategoryDto = {
    id: 1,
    name: 'Electronics',
    slug: 'electronics',
    category: 1,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
    deletedAt: null,
    deletedBy: null,
  };

  const mockSubcategories = generateManySubcategories(10);
  const mockNewSubcategory: CreateSubcategoryDto = createSubcategory();

  const countResponse = {
    statusCode: HttpStatus.OK,
    total: mockSubcategories.length,
  };
  const findAllResponse = {
    statusCode: HttpStatus.OK,
    data: [mockResponseSubcategory],
    meta: { total: 1, page: 1, limit: 10 },
  };
  const findAllByCategoryResponse = {
    statusCode: HttpStatus.OK,
    data: [mockResponseSubcategory],
    total: 1,
  };
  const findOneResponse = {
    statusCode: HttpStatus.OK,
    data: mockResponseSubcategory,
  };
  const findOneBySlugResponse = {
    statusCode: HttpStatus.OK,
    data: mockResponseSubcategory,
  };
  const createResponse = {
    statusCode: HttpStatus.CREATED,
    data: mockResponseSubcategory,
    message: 'The Subcategory was created',
  };
  const updateResponse = {
    statusCode: HttpStatus.OK,
    data: mockResponseSubcategory,
    message: 'The Subcategory with ID: 1 has been modified',
  };
  const removeResponse = {
    statusCode: HttpStatus.OK,
    message: 'The Subcategory with ID: 1 has been deleted',
  };

  const mockService = {
    count: jest.fn().mockResolvedValue(countResponse),
    findAll: jest.fn().mockResolvedValue(findAllResponse),
    findAllByCategory: jest.fn().mockResolvedValue(findAllByCategoryResponse),
    findOne: jest.fn().mockResolvedValue(findOneResponse),
    findOneBySlug: jest.fn().mockResolvedValue(findOneBySlugResponse),
    create: jest.fn().mockResolvedValue(createResponse),
    update: jest.fn().mockResolvedValue(updateResponse),
    remove: jest.fn().mockResolvedValue(removeResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubcategoryController],
      providers: [
        {
          provide: SubcategoryService,
          useValue: mockService as unknown as SubcategoryService,
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
      const result = await controller.count();
      expect(result).toEqual(countResponse);
      expect(service.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('Find subcategories controllers', () => {
    it('should call findAll subcategory service', async () => {
      const result = await controller.findAll();
      expect(result).toEqual(findAllResponse);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should call findAllByCategory subcategory service', async () => {
      const result = await controller.findAllByCategory(1);
      expect(result).toEqual(findAllByCategoryResponse);
      expect(service.findAllByCategory).toHaveBeenCalledTimes(1);
      expect(service.findAllByCategory).toHaveBeenCalledWith(1);
    });

    it('should call findOne subcategory service', async () => {
      const result = await controller.findOne(1);
      expect(result).toEqual(findOneResponse);
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should call findOneBySlug subcategory service', async () => {
      const result = await controller.findOneBySlug('electronics');
      expect(result).toEqual(findOneBySlugResponse);
      expect(service.findOneBySlug).toHaveBeenCalledTimes(1);
      expect(service.findOneBySlug).toHaveBeenCalledWith('electronics');
    });
  });

  describe('create subcategory controller', () => {
    it('should call create subcategory service', async () => {
      const userId = 1;
      const result = await controller.create(mockNewSubcategory, userId);
      expect(result).toEqual(createResponse);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith(mockNewSubcategory, userId);
    });
  });

  describe('update subcategory controller', () => {
    it('should call update subcategory service', async () => {
      const id = 1;
      const userId = 1;
      const changes: UpdateSubcategoryDto = { name: 'newName' };
      const result = await controller.update(id, changes, userId);
      expect(result).toEqual(updateResponse);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(service.update).toHaveBeenCalledWith(id, userId, changes);
    });
  });

  describe('remove subcategory controller', () => {
    it('should call remove subcategory service', async () => {
      const id = 1;
      const userId = 1;
      const result = await controller.remove(id, userId);
      expect(result).toEqual(removeResponse);
      expect(service.remove).toHaveBeenCalledTimes(1);
      expect(service.remove).toHaveBeenCalledWith(id, userId);
    });
  });
});
