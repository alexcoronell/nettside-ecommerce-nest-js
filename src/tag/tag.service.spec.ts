import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

/* Services */
import { TagService } from './tag.service';

/* Entity */
import { Tag } from './entities/tag.entity';

/* DTO's */
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Faker */
import { generateTag, generateManyTags } from '@faker/tag.faker';
import { User } from '@user/entities/user.entity';

describe('TagService', () => {
  let service: TagService;

  const mockTag: Tag = generateTag();
  const mockTags: Tag[] = generateManyTags(10);

  const createMockRepo = () => ({
    count: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    merge: jest.fn(),
  });

  let mockRepository: ReturnType<typeof createMockRepo>;

  beforeEach(async () => {
    mockRepository = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: getRepositoryToken(Tag),
          useValue: mockRepository,
        },
      ],
    }).compile();
    service = module.get<TagService>(TagService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count', () => {
    it('should return total non-deleted tags', async () => {
      mockRepository.count.mockResolvedValue(100);
      const result = await service.count();
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { isDeleted: false },
      });
      expect(result.statusCode).toBe(200);
      expect(result.total).toBe(100);
    });

    it('should handle count errors', async () => {
      mockRepository.count.mockRejectedValue(new Error('DB error'));
      await expect(service.count()).rejects.toThrow('DB error');
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted tags with default pagination', async () => {
      mockRepository.findAndCount.mockResolvedValue([
        mockTags,
        mockTags.length,
      ]);
      const result = await service.findAll();
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { isDeleted: false },
        relations: ['createdBy', 'updatedBy'],
        order: { name: 'ASC' },
        skip: 0,
        take: 10,
      });
      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(mockTags);
    });

    it('should apply custom pagination', async () => {
      const paginationDto: PaginationDto = { page: 2, limit: 5 };
      mockRepository.findAndCount.mockResolvedValue([mockTags.slice(0, 5), 5]);
      await service.findAll(paginationDto);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });

    it('should apply search with ILike', async () => {
      const paginationDto: PaginationDto = { search: 'test' };
      mockRepository.findAndCount.mockResolvedValue([
        mockTags,
        mockTags.length,
      ]);
      await service.findAll(paginationDto);
      expect(mockRepository.findAndCount).toHaveBeenCalled();
    });

    it('should apply custom sorting', async () => {
      const paginationDto: PaginationDto = { sortBy: 'id', sortOrder: 'DESC' };
      mockRepository.findAndCount.mockResolvedValue([
        mockTags,
        mockTags.length,
      ]);
      await service.findAll(paginationDto);
      expect(mockRepository.findAndCount).toHaveBeenCalled();
    });

    it('should handle findAndCount errors', async () => {
      mockRepository.findAndCount.mockRejectedValue(new Error('DB error'));
      await expect(service.findAll()).rejects.toThrow('DB error');
    });
  });

  describe('findOne', () => {
    it('should return tag by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockTag);
      const result = await service.findOne(1);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { id: 1, isDeleted: false },
      });
      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(mockTag);
    });

    it('should throw NotFoundException if tag not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(42)).rejects.toThrow(
        'The Tag with ID: 42 not found',
      );
    });

    it('should handle findOne errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB error'));
      await expect(service.findOne(1)).rejects.toThrow('DB error');
    });
  });

  describe('create', () => {
    it('should create a new tag with user relations', async () => {
      const dto: CreateTagDto = { name: 'New Tag' };
      const userId: User['id'] = 1;
      mockRepository.create.mockReturnValue({ ...dto });
      mockRepository.save.mockResolvedValue({ id: 1, ...dto });
      const result = await service.create(dto, userId);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...dto,
        createdBy: { id: userId },
        updatedBy: { id: userId },
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.statusCode).toBe(201);
    });

    it('should return created tag with message', async () => {
      mockRepository.create.mockReturnValue(mockTag);
      mockRepository.save.mockResolvedValue(mockTag);
      const result = await service.create(mockTag, 1);
      expect(result.message).toBe('The Tag was created');
    });

    it('should handle create errors', async () => {
      mockRepository.create.mockReturnValue(mockTag);
      mockRepository.save.mockRejectedValue(new Error('DB error'));
      await expect(service.create(mockTag, 1)).rejects.toThrow('DB error');
    });
  });

  describe('update', () => {
    it('should update tag and set updatedBy relation', async () => {
      const changes: UpdateTagDto = { name: 'Updated Name' };
      const userId: User['id'] = 1;
      mockRepository.findOne.mockResolvedValue(mockTag);
      mockRepository.merge.mockReturnValue({ ...mockTag, ...changes });
      mockRepository.save.mockResolvedValue({ ...mockTag, ...changes });
      const result = await service.update(1, userId, changes);
      expect(mockRepository.merge).toHaveBeenCalledWith(mockTag, {
        ...changes,
        updatedBy: { id: userId },
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.statusCode).toBe(200);
    });

    it('should throw NotFoundException if tag does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.update(999, 1, { name: 'test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return message with tag id', async () => {
      mockRepository.findOne.mockResolvedValue(mockTag);
      mockRepository.merge.mockReturnValue(mockTag);
      mockRepository.save.mockResolvedValue(mockTag);
      const result = await service.update(42, 1, { name: 'test' });
      expect(result.message).toBe('The Tag with ID: 42 has been modified');
    });

    it('should handle update errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB error'));
      await expect(service.update(1, 1, { name: 'test' })).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('remove', () => {
    it('should soft delete tag by setting isDeleted to true', async () => {
      const userId: User['id'] = 1;
      mockRepository.findOne.mockResolvedValue(mockTag);
      mockRepository.merge.mockReturnValue({ ...mockTag, isDeleted: true });
      mockRepository.save.mockResolvedValue({ ...mockTag, isDeleted: true });
      const result = await service.remove(1, userId);
      expect(mockRepository.merge).toHaveBeenCalledWith(mockTag, {
        isDeleted: true,
        deletedBy: { id: userId },
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.statusCode).toBe(200);
    });

    it('should throw NotFoundException if tag does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should return message with tag id', async () => {
      mockRepository.findOne.mockResolvedValue(mockTag);
      mockRepository.merge.mockReturnValue({ ...mockTag, isDeleted: true });
      mockRepository.save.mockResolvedValue({ ...mockTag, isDeleted: true });
      const result = await service.remove(42, 1);
      expect(result.message).toBe('The Tag with ID: 42 has been deleted');
    });

    it('should handle remove errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB error'));
      await expect(service.remove(1, 1)).rejects.toThrow('DB error');
    });
  });
});
