/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { SubcategoryService } from './subcategory.service';

/* Entity */
import { Subcategory } from './entities/subcategory.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

/* Faker */
import {
  generateSubcategory,
  generateManySubcategories,
} from '@faker/subcategory.faker';

describe('SubcategoryService', () => {
  let service: SubcategoryService;
  let repository: Repository<Subcategory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubcategoryService,
        {
          provide: getRepositoryToken(Subcategory),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<SubcategoryService>(SubcategoryService);
    repository = module.get<Repository<Subcategory>>(
      getRepositoryToken(Subcategory),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count subcategories services', () => {
    it('should return total subcategories not removed', async () => {
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

  describe('find subcategories services', () => {
    it('findAll should return all subcategories with pagination as ResponseSubcategoryDto', async () => {
      const subcategories = generateManySubcategories(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([subcategories, subcategories.length]);

      const result = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { name: 'ASC' },
        relations: ['category', 'createdBy', 'updatedBy'],
        skip: 0,
        take: 10,
      });
      expect(result.statusCode).toBe(200);
      expect(result.meta.total).toEqual(subcategories.length);
      // Verify data is mapped to ResponseSubcategoryDto
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('name');
      expect(result.data[0]).toHaveProperty('slug');
      expect(result.data[0]).not.toHaveProperty('createdBy');
    });

    it('findAllByCategory should return all subcategories by category as ResponseSubcategoryDto', async () => {
      const categoryId = 3;
      const subcategories = generateManySubcategories(3, categoryId);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([subcategories, subcategories.length]);

      const result = await service.findAllByCategory(categoryId);
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { category: { id: categoryId }, isDeleted: false },
        order: { name: 'ASC' },
        relations: ['category', 'createdBy', 'updatedBy'],
      });
      expect(result.statusCode).toBe(200);
      expect(result.total).toEqual(subcategories.length);
      // Verify data is ResponseSubcategoryDto
      expect(result.data![0]).toHaveProperty('id');
      expect(result.data![0]).toHaveProperty('name');
      expect(result.data![0]).not.toHaveProperty('createdBy');
    });

    it('findOne should return a subcategory as ResponseSubcategoryDto', async () => {
      const subcategory = generateSubcategory(1);
      const id = subcategory.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(subcategory);

      const result = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy', 'category'],
        where: { id, isDeleted: false },
      });
      expect(result.statusCode).toBe(200);
      // Verify data is ResponseSubcategoryDto, not Subcategory entity
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('name');
      expect(result.data).toHaveProperty('slug');
      expect(result.data).not.toHaveProperty('createdBy');
    });

    it('findOne should throw NotFoundException if subcategory does not exist', async () => {
      const id = 99999;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrowError(
        new NotFoundException(`The Subcategory with ID: ${id} not found`),
      );
    });

    it('findOneBySlug should return a subcategory as ResponseSubcategoryDto', async () => {
      const subcategory = generateSubcategory(1);
      const slug = subcategory.slug;

      jest.spyOn(repository, 'findOne').mockResolvedValue(subcategory);

      const result = await service.findOneBySlug(slug);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy', 'category'],
        where: { slug, isDeleted: false },
      });
      expect(result.statusCode).toBe(200);
      // Verify data is ResponseSubcategoryDto
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('name');
      expect(result.data).not.toHaveProperty('createdBy');
    });

    it('findOneBySlug should throw NotFoundException if subcategory does not exist', async () => {
      const slug = 'non-existent-slug';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOneBySlug(slug)).rejects.toThrowError(
        new NotFoundException(`The Subcategory with SLUG: ${slug} not found`),
      );
    });
  });

  describe('create subcategory services', () => {
    it('create should return a subcategory as ResponseSubcategoryDto', async () => {
      const subcategory = generateSubcategory(1);
      const userId: User['id'] = 1;

      // First call: findOne returns null (no conflict)
      // Second call: findOne returns subcategory (re-fetch after save)
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(subcategory);
      jest.spyOn(repository, 'create').mockReturnValue(subcategory);
      jest.spyOn(repository, 'save').mockResolvedValue(subcategory);

      const createDto: CreateSubcategoryDto = {
        name: subcategory.name,
        category: subcategory.category.id,
      };

      const result = await service.create(createDto, userId);
      expect(repository.findOne).toHaveBeenCalled(); // Check for conflict
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result.statusCode).toBe(201);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('name');
      expect(result.data).toHaveProperty('slug');
      expect(result.message).toBe('The Subcategory was created');
    });

    it('create should return Conflict Exception when name subcategory exists with the same category', async () => {
      const subcategory = generateSubcategory(1);
      const userId: User['id'] = 1;

      // Mock: findOne returns existing subcategory (conflict)
      jest.spyOn(repository, 'findOne').mockResolvedValue(subcategory);

      const createDto: CreateSubcategoryDto = {
        name: subcategory.name,
        category: subcategory.category.id,
      };

      await expect(service.create(createDto, userId)).rejects.toThrowError(
        new ConflictException(
          `The Subcategory NAME ${subcategory.name} is already in use with the same Category`,
        ),
      );
    });
  });

  describe('update subcategory services', () => {
    it('update should return updated subcategory as ResponseSubcategoryDto', async () => {
      const subcategory = generateSubcategory(1);
      const id = subcategory.id;
      const userId: User['id'] = 1;

      const changes: UpdateSubcategoryDto = {
        name: 'New Name',
        category: subcategory.category.id,
      };

      const updatedSubcategory: Subcategory = {
        ...subcategory,
        ...changes,
        slug: 'new-name',
      } as Subcategory;

      // First call: findOne to check existence
      // Second call: findOne for conflict check (if name changed)
      // Third call: findOne for slug conflict check
      // Fourth call: findOne for re-fetch after save
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(subcategory)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(updatedSubcategory);

      jest.spyOn(repository, 'merge').mockReturnValue(updatedSubcategory);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedSubcategory);

      const result = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(4);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
      expect(result.message).toEqual(
        `The Subcategory with ID: ${id} has been modified`,
      );
      expect(result.data).toHaveProperty('id');
      expect(result.data).not.toHaveProperty('createdBy');
    });

    it('update should return Conflict Exception when name subcategory exists with the same category', async () => {
      const subcategory = generateSubcategory(1);
      const id = subcategory.id;
      const userId: User['id'] = 1;

      const differentSubcategory = generateSubcategory(2);
      differentSubcategory.category = subcategory.category;

      const changes: UpdateSubcategoryDto = {
        name: 'New Name',
        category: subcategory.category.id,
      };

      // First call: findOne to check existence
      // Second call: findOne for conflict check - returns different subcategory
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(subcategory)
        .mockResolvedValueOnce(differentSubcategory);

      await expect(service.update(id, userId, changes)).rejects.toThrowError(
        new ConflictException(
          `The Subcategory NAME ${changes.name} is already in use with the same Category`,
        ),
      );
    });

    it('update should throw NotFoundException if Subcategory does not exist', async () => {
      const id = 99999;
      const userId: User['id'] = 1;

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.update(id, userId, { name: 'newName' }),
      ).rejects.toThrowError(
        new NotFoundException(`The Subcategory with ID: ${id} not found`),
      );
    });
  });

  describe('remove subcategory services', () => {
    it('remove should return status and message', async () => {
      const subcategory = generateSubcategory(1);
      const id = subcategory.id;
      const userId: User['id'] = 1;

      jest.spyOn(repository, 'findOne').mockResolvedValue(subcategory);
      jest.spyOn(repository, 'merge').mockReturnValue(subcategory);
      jest.spyOn(repository, 'save').mockResolvedValue(subcategory);

      const { statusCode, message } = await service.remove(id, userId);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(
        `The Subcategory with ID: ${id} has been deleted`,
      );
    });

    it('remove should throw NotFoundException if subcategory does not exist', async () => {
      const id = 99999;
      const userId: User['id'] = 1;

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Subcategory with ID: ${id} not found`),
      );
    });
  });
});
