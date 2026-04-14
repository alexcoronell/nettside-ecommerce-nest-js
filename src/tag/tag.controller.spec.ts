/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

/* Controller */
import { TagController } from './tag.controller';

/* Services */
import { TagService } from './tag.service';

/* Entities */
import { Tag } from './entities/tag.entity';

/* DTO's */
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Faker */
import { createTag, generateTag, generateManyTags } from '@faker/tag.faker';

describe('TagController', () => {
  let controller: TagController;
  let service: TagService;

  const mockTag: Tag = generateTag();
  const mockTags: Tag[] = generateManyTags(10);
  const mockNewTag: CreateTagDto = createTag();

  const mockService = {
    count: jest
      .fn()
      .mockResolvedValue({ statusCode: 200, total: mockTags.length }),
    findAll: jest.fn().mockResolvedValue({
      statusCode: 200,
      data: mockTags,
      meta: { total: mockTags.length, page: 1, limit: 10 },
    }),
    findOne: jest.fn().mockResolvedValue({ statusCode: 200, data: mockTag }),
    create: jest.fn().mockResolvedValue({
      statusCode: 201,
      data: mockTag,
      message: 'Created',
    }),
    update: jest.fn().mockResolvedValue({
      statusCode: 200,
      data: mockTag,
      message: 'Updated',
    }),
    remove: jest
      .fn()
      .mockResolvedValue({ statusCode: 200, message: 'Deleted' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagController],
      providers: [
        {
          provide: TagService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TagController>(TagController);
    service = module.get<TagService>(TagService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('count', () => {
    it('should call count service and return total tags', async () => {
      const result = await controller.count();
      expect(service.count).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
      expect(result.total).toBe(mockTags.length);
    });

    it('should handle count service errors', async () => {
      mockService.count.mockRejectedValueOnce(new Error('Count error'));
      await expect(controller.count()).rejects.toThrow('Count error');
    });
  });

  describe('findAll', () => {
    it('should call findAll without pagination params', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(result.statusCode).toBe(200);
    });

    it('should call findAll with pagination params', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };
      const result = await controller.findAll(paginationDto);
      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result.statusCode).toBe(200);
    });

    it('should call findAll with sort params', async () => {
      const paginationDto: PaginationDto = {
        page: 2,
        limit: 5,
        sortBy: 'name',
        sortOrder: 'DESC',
      };
      await controller.findAll(paginationDto);
      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
    });

    it('should handle findAll service errors', async () => {
      mockService.findAll.mockRejectedValueOnce(new Error('Find error'));
      await expect(controller.findAll()).rejects.toThrow('Find error');
    });
  });

  describe('findOne', () => {
    it('should call findOne with valid id', async () => {
      const result = await controller.findOne(1);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(mockTag);
    });

    it('should convert string id to number', async () => {
      await controller.findOne('5' as unknown as number);
      expect(service.findOne).toHaveBeenCalledWith(5);
    });

    it('should handle NotFoundException from service', async () => {
      mockService.findOne.mockRejectedValueOnce(
        new NotFoundException('Tag not found'),
      );
      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should call create with valid data and userId', async () => {
      const userId = 1;
      const result = await controller.create(mockNewTag, userId);
      expect(service.create).toHaveBeenCalledWith(mockNewTag, userId);
      expect(result.statusCode).toBe(201);
    });

    it('should handle create service errors', async () => {
      mockService.create.mockRejectedValueOnce(new Error('Create error'));
      await expect(controller.create(mockNewTag, 1)).rejects.toThrow(
        'Create error',
      );
    });
  });

  describe('update', () => {
    it('should call update with valid id, userId and changes', async () => {
      const userId = 1;
      const changes: UpdateTagDto = { name: 'Updated Name' };
      const result = await controller.update(1, userId, changes);
      expect(service.update).toHaveBeenCalledWith(1, userId, changes);
      expect(result.statusCode).toBe(200);
    });

    it('should handle update service errors', async () => {
      mockService.update.mockRejectedValueOnce(new Error('Update error'));
      await expect(controller.update(1, 1, { name: 'test' })).rejects.toThrow(
        'Update error',
      );
    });
  });

  describe('remove', () => {
    it('should call remove with valid id and userId', async () => {
      const userId = 1;
      const result = await controller.remove(1, userId);
      expect(service.remove).toHaveBeenCalledWith(1, userId);
      expect(result.statusCode).toBe(200);
    });

    it('should handle NotFoundException from service', async () => {
      mockService.remove.mockRejectedValueOnce(
        new NotFoundException('Tag not found'),
      );
      await expect(controller.remove(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle remove service errors', async () => {
      mockService.remove.mockRejectedValueOnce(new Error('Remove error'));
      await expect(controller.remove(1, 1)).rejects.toThrow('Remove error');
    });
  });
});
