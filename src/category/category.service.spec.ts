/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { CategoryService } from './category.service';

/* Entity */
import { Category } from './entities/category.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/* Faker */
import {
  generateCategory,
  generateManyCategories,
} from '@faker/category.faker';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: Repository<Category>;

  // Helper to create mock DTO without slug (like the real DTO)
  const createMockCategoryDto = (
    name: string = 'Test Category',
  ): CreateCategoryDto => ({
    name,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<CategoryService>(CategoryService);
    repository = module.get<Repository<Category>>(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count categories services', () => {
    it('should return total categories not removed', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);
      const { statusCode, total } = await service.count();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(repository.count).toHaveBeenCalledWith({
        where: { isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });
  });

  describe('findAllNoPagination categories services', () => {
    it('should return all categories with id and name only', async () => {
      const categories = generateManyCategories(5);

      jest.spyOn(repository, 'find').mockResolvedValue(categories);

      const result = await service.findAllNoPagination();
      expect(repository.find).toHaveBeenCalledTimes(1);
      expect(repository.find).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { name: 'ASC' },
        select: ['id', 'name'],
      });
      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();

      const [first] = result.data!;
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
    });

    it('should return empty array when no categories exist', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findAllNoPagination();
      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data!).toHaveLength(0);
    });
  });

  describe('find categories services', () => {
    it('findAll should return all categories with pagination', async () => {
      const categories = generateManyCategories(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([categories, categories.length]);

      const { statusCode, data, meta } = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(meta.total).toEqual(categories.length);
      // Verify data is mapped to ResponseCategoryDto
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('slug');
    });

    it('findOne should return a category', async () => {
      const category = generateCategory(1);
      const id = category.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(category);

      const { statusCode, data } = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { id, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      // Verify data is ResponseCategoryDto, not Category entity
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('slug');
    });

    it('findOne should throw NotFoundException if category does not exist', async () => {
      const id = 99999;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrowError(
        new NotFoundException(`The Category with ID: ${id} not found`),
      );
    });

    it('findOneBySlug should return a category', async () => {
      const category = generateCategory(1);
      const slug = category.slug;

      jest.spyOn(repository, 'findOne').mockResolvedValue(category);

      const { statusCode, data } = await service.findOneBySlug(slug);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(data).toHaveProperty('slug', slug);
    });

    it('findOneBySlug should throw NotFoundException if category does not exist', async () => {
      const slug = 'non-existent-slug';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOneBySlug(slug)).rejects.toThrowError(
        new NotFoundException(`The Category with SLUG: ${slug} not found`),
      );
    });
  });

  describe('create category services', () => {
    it('create should return a created category with ResponseCategoryDto', async () => {
      const dto = createMockCategoryDto('New Category');
      const userId: User['id'] = 1;

      // Create a mock category entity that will be returned after save
      const savedCategory = generateCategory(1);
      savedCategory.name = dto.name;

      jest.spyOn(repository, 'create').mockReturnValue(savedCategory);
      jest.spyOn(repository, 'save').mockResolvedValue(savedCategory);
      jest.spyOn(repository, 'findOne').mockResolvedValue(savedCategory);

      const { statusCode, data, message } = await service.create(dto, userId);
      expect(statusCode).toBe(201);
      expect(message).toBe('The Category was created');
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name', dto.name);
      expect(data).toHaveProperty('slug');
    });
  });

  describe('update category services', () => {
    it('update should return message: have been modified', async () => {
      const category = generateCategory(1);
      const id = category.id;
      const userId: User['id'] = 1;
      const changes: UpdateCategoryDto = {
        name: 'Updated Name',
      };

      const updatedCategory = { ...category, ...changes };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(category) // First call in update method
        .mockResolvedValueOnce(updatedCategory); // Second call for re-fetch after save
      jest.spyOn(repository, 'merge').mockReturnValue(updatedCategory);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedCategory);

      const { statusCode, message } = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(2);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Category with ID: ${id} has been modified`);
    });

    it('update should throw NotFoundException if Category does not exist', async () => {
      const id = 99999;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.update(id, userId, { name: 'newName' }),
      ).rejects.toThrowError(
        new NotFoundException(`The Category with ID: ${id} not found`),
      );
    });
  });

  describe('remove category services', () => {
    it('remove should return status and message', async () => {
      const category = generateCategory(1);
      const id = category.id;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(category);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...category, isDeleted: true });
      jest.spyOn(repository, 'save').mockResolvedValue(category);

      const { statusCode, message } = await service.remove(id, userId);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Category with ID: ${id} has been deleted`);
    });

    it('remove should throw NotFoundException if category does not exist', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Category with ID: ${id} not found`),
      );
    });
  });
});
