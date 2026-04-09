/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { CategoryService } from './category.service';

/* Entity */
import { Category } from './entities/category.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { UpdateCategoryDto } from './dto/update-category.dto';

/* Faker */
import {
  generateCategory,
  generateManyCategories,
} from '@faker/category.faker';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: Repository<Category>;

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

  describe('find categories services', () => {
    it('findAll should return all categories with pagination', async () => {
      const categories = generateManyCategories(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([categories.slice(0, 10), categories.length]);

      const { statusCode, data, meta } = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isDeleted: false },
        relations: ['createdBy', 'updatedBy'],
        order: { name: 'ASC' },
        skip: 0,
        take: 10,
      });
      expect(statusCode).toBe(200);
      expect(meta.total).toEqual(categories.length);
      expect(data).toEqual(categories.slice(0, 10));
    });

    it('findOne should return a category', async () => {
      const category = generateCategory();
      const id = category.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(category);

      const { statusCode, data } = await service.findOne(id);
      const dataCategory: Category = data as Category;
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { id, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(dataCategory).toEqual(category);
    });

    it('findOne should throw NotFoundException if category does not exist', async () => {
      const id = 99999;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Category with ID: ${id} not found`);
      }
    });

    it('findOne should throw NotFoundException if category does not exist with Rejects', async () => {
      const id = 99999;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrowError(
        new NotFoundException(`The Category with ID: ${id} not found`),
      );
    });

    it('findOneBySlug should return a category', async () => {
      const category = generateCategory();
      const slug = category.slug;

      jest.spyOn(repository, 'findOne').mockResolvedValue(category);

      const { statusCode, data } = await service.findOneBySlug(slug);
      const dataCategory: Category = data as Category;
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(dataCategory).toEqual(category);
    });

    it('findOneBySlug should throw NotFoundException if category does not exist', async () => {
      const slug = 'slugTest';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOneBySlug(slug);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Category with SLUG: ${slug} not found`);
      }
    });
  });

  describe('create category services', () => {
    it('create should return a category', async () => {
      const category = generateCategory();
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(category);
      jest.spyOn(repository, 'save').mockResolvedValue(category);

      const { statusCode, data } = await service.create(category, userId);
      expect(statusCode).toBe(201);
      expect(data).toEqual(category);
    });

    it('create should return Conflict Exception when name category exists', async () => {
      const category = generateCategory();
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'create').mockReturnValue(category);
      jest.spyOn(repository, 'save').mockResolvedValue(category);

      try {
        await service.create(category, userId);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(`Category ${category.name} already exists`);
      }
    });
  });

  describe('update category services', () => {
    it('update should return message: have been modified', async () => {
      const category = generateCategory();
      const id = category.id;
      const userId: User['id'] = 1;
      const changes: UpdateCategoryDto = {
        name: 'new name',
        slug: 'new-name',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(category);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...category, ...changes });
      jest.spyOn(repository, 'save').mockResolvedValue(category);

      const { statusCode, message } = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Category with ID: ${id} has been modified`);
    });

    it('update should return Conflict Exception when name category exists', async () => {
      const category = generateManyCategories(2);
      const name = category[0].name;
      const id = category[1].id;
      const userId: User['id'] = 1;
      const changes: UpdateCategoryDto = { name };
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(category[0]);
      jest.spyOn(repository, 'merge').mockReturnValue(category[1]);
      jest.spyOn(repository, 'save').mockResolvedValue(category[1]);

      try {
        await service.update(id, userId, changes);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          `The Category NAME: ${name} is already in use`,
        );
      }
    });

    it('update should throw NotFoundException if Category does not exist', async () => {
      const id = 99999;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.update(id, userId, { name: 'newName' });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Category with ID: ${id} not found`);
      }
    });
  });

  describe('remove category services', () => {
    it('remove should return status and message', async () => {
      const category = generateCategory();
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

    it('remove should throw NotFoundException if category does not exist with Rejects', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Category with ID: ${id} not found`),
      );
    });
  });
});
