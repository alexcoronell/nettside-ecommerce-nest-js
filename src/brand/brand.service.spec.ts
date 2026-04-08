/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { BrandService } from '@brand/brand.service';

/* Entities */
import { Brand } from '@brand/entities/brand.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { UpdateBrandDto } from '@brand/dto/update-brand.dto';

/* Faker */
import { generateBrand, generateManyBrands } from '@faker/brand.faker';

describe('BrandService', () => {
  let service: BrandService;
  let repository: Repository<Brand>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandService,
        {
          provide: getRepositoryToken(Brand),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<BrandService>(BrandService);
    repository = module.get<Repository<Brand>>(getRepositoryToken(Brand));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('count brands services', () => {
    it('should return total brands not removed', async () => {
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

  describe('find brands services', () => {
    it('findAll should return all brands with pagination', async () => {
      const brands = generateManyBrands(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([brands.slice(0, 10), brands.length]);

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
      expect(meta.total).toEqual(brands.length);
      expect(data).toEqual(brands.slice(0, 10));
    });

    it('findOne should return a brand', async () => {
      const brand = generateBrand();
      const id = brand.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(brand);

      const { statusCode, data } = await service.findOne(id);
      const dataBrand: Brand = data as Brand;
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { id, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(dataBrand).toEqual(brand);
    });

    it('findOne should throw NotFoundException if Brand does not exist', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Brand with ID: ${id} not found`);
      }
    });

    it('findOne should throw NotFoundException if brand does not exist with Rejects', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrowError(
        new NotFoundException(`The Brand with ID: ${id} not found`),
      );
    });
  });

  describe('create brand services', () => {
    it('create should return a brand', async () => {
      const brand = generateBrand();
      const userId: User['id'] = 1;

      jest.spyOn(repository, 'create').mockReturnValue(brand);
      jest.spyOn(repository, 'save').mockResolvedValue(brand);

      const { statusCode, data } = await service.create(brand, userId);
      expect(statusCode).toBe(201);
      expect(data).toEqual(brand);
    });

    it('create should return Conflict Exception when name brand exists', async () => {
      const brand = generateBrand();
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(brand);
      jest.spyOn(repository, 'create').mockReturnValue(brand);
      jest.spyOn(repository, 'save').mockResolvedValue(brand);

      try {
        await service.create(brand, userId);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          `The Brand NAME: ${brand.name} is already in use`,
        );
      }
    });
  });

  describe('update brand services', () => {
    it('update should return message: have been modified', async () => {
      const brand = generateBrand();
      const id = brand.id;
      const userId: User['id'] = 1;
      const changes: UpdateBrandDto = { name: 'new name', slug: 'new-name' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(brand);
      jest.spyOn(repository, 'merge').mockReturnValue({ ...brand, ...changes });
      jest.spyOn(repository, 'save').mockResolvedValue(brand);

      const { statusCode, message } = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Brand with ID: ${id} has been modified`);
    });

    it('update should throw NotFoundException if Brand does not exist', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.update(id, userId, { name: 'newName' });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Brand with ID: ${id} not found`);
      }
    });

    it('update should throw ConflictException if the new name already exists', async () => {
      const brands = generateManyBrands(2);
      const name = brands[0].name;
      const id = brands[1].id;
      const userId: User['id'] = 1;
      const changes: UpdateBrandDto = { name };
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(brands[0]);
      jest.spyOn(repository, 'merge').mockReturnValue(brands[1]);
      jest.spyOn(repository, 'save').mockResolvedValue(brands[1]);

      try {
        await service.update(id, userId, changes);
      } catch (error) {
        expect(repository.findOne).toHaveBeenCalledTimes(1);
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          `The Brand name: ${changes.name} is already in use`,
        );
      }
    });
  });

  describe('remove brand services', () => {
    it('remove should return status and message', async () => {
      const brand = generateBrand();
      const id = brand.id;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(brand);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...brand, isDeleted: true });
      jest.spyOn(repository, 'save').mockResolvedValue(brand);

      const { statusCode, message } = await service.remove(id, userId);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Brand with ID: ${id} has been deleted`);
    });

    it('remove should throw NotFoundException if Brand does not exist with Rejects', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Brand with ID: ${id} not found`),
      );
    });
  });
});
