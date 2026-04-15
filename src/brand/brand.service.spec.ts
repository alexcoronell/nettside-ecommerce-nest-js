/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234',
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  CreateBucketCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    done: jest.fn().mockResolvedValue({}),
  })),
}));

/* Services */
import { BrandService } from '@brand/brand.service';
import { UploadService } from '@upload/upload.service';

/* Entities */
import { Brand } from '@brand/entities/brand.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { UpdateBrandDto } from '@brand/dto/update-brand.dto';

/* Faker */
import { generateBrand, generateManyBrands } from '@faker/brand.faker';

/* Mappers */
import {
  mapBrandToResponseDto,
  mapBrandsToResponseDto,
} from '@brand/mappers/brand.mapper';

const mockUploadService = {
  uploadLogo: jest.fn(),
  deleteFile: jest.fn(),
  extractKeyFromUrl: jest.fn(),
};

describe('BrandService', () => {
  let service: BrandService;
  let repository: Repository<Brand>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandService,
        {
          provide: getRepositoryToken(Brand),
          useClass: Repository,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
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
      expect(data).toEqual(mapBrandsToResponseDto(brands.slice(0, 10)));
    });

    it('findOne should return a brand', async () => {
      const brand = generateBrand();
      const id = brand.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(brand);

      const { statusCode, data } = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { id, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(mapBrandToResponseDto(brand));
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
      jest.spyOn(repository, 'findOne').mockResolvedValue(brand);

      const { statusCode, data } = await service.create(brand, userId);
      expect(statusCode).toBe(201);
      expect(data).toEqual(mapBrandToResponseDto(brand));
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
      const changes: UpdateBrandDto = { name: 'new name' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(brand);
      jest.spyOn(repository, 'merge').mockReturnValue({ ...brand, ...changes });
      jest.spyOn(repository, 'save').mockResolvedValue(brand);
      jest.spyOn(repository, 'findOne').mockResolvedValue(brand);

      const { statusCode, message } = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(2);
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
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(brands[1]);

      try {
        await service.update(id, userId, changes);
      } catch (error) {
        expect(repository.findOne).toHaveBeenCalledTimes(2);
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          `The Brand name: ${changes.name} is already in use`,
        );
      }
    });

    it('update should delete logo when file is not provided and brand has existing logo', async () => {
      const brand = generateBrand();
      brand.logo = 'http://localhost:9000/brand-logos/test.png';
      const id = brand.id;
      const userId: User['id'] = 1;
      const changes: UpdateBrandDto = { name: 'new name' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(brand);
      mockUploadService.extractKeyFromUrl.mockReturnValue({
        key: 'test.png',
        bucket: 'brand-logos',
      });
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...brand, ...changes, logo: null });
      jest.spyOn(repository, 'save').mockResolvedValue(brand);
      jest.spyOn(repository, 'findOne').mockResolvedValue(brand);

      const { statusCode, data } = await service.update(
        id,
        userId,
        changes,
        undefined,
      );
      expect(mockUploadService.deleteFile).toHaveBeenCalledWith(
        'test.png',
        'brand-logos',
      );
      expect(statusCode).toBe(200);
      expect(data).toEqual(mapBrandToResponseDto(brand));
    });

    it('update should upload new logo and delete old one when file is provided', async () => {
      const brand = generateBrand();
      brand.logo = 'http://localhost:9000/brand-logos/old.png';
      const id = brand.id;
      const userId: User['id'] = 1;
      const changes: UpdateBrandDto = { name: 'new name' };
      const mockFile = { originalname: 'new-logo.png' } as Express.Multer.File;

      jest.spyOn(repository, 'findOne').mockResolvedValue(brand);
      mockUploadService.extractKeyFromUrl.mockReturnValue({
        key: 'old.png',
        bucket: 'brand-logos',
      });
      mockUploadService.uploadLogo.mockResolvedValue({
        url: 'http://localhost:9000/brand-logos/new.png',
        key: 'new.png',
        filename: 'new-logo.png',
        size: 100,
        mimetype: 'image/png',
      });
      jest.spyOn(repository, 'merge').mockReturnValue({
        ...brand,
        ...changes,
        logo: 'http://localhost:9000/brand-logos/new.png',
      });
      jest.spyOn(repository, 'save').mockResolvedValue(brand);
      jest.spyOn(repository, 'findOne').mockResolvedValue(brand);

      const { statusCode, data } = await service.update(
        id,
        userId,
        changes,
        mockFile,
      );
      expect(mockUploadService.deleteFile).toHaveBeenCalledWith(
        'old.png',
        'brand-logos',
      );
      expect(mockUploadService.uploadLogo).toHaveBeenCalledWith(mockFile);
      expect(statusCode).toBe(200);
      expect(data).toEqual(mapBrandToResponseDto(brand));
    });

    it('update should upload new logo without deleting when brand has no existing logo', async () => {
      const brand = generateBrand();
      brand.logo = null;
      const id = brand.id;
      const userId: User['id'] = 1;
      const changes: UpdateBrandDto = { name: 'new name' };
      const mockFile = { originalname: 'new-logo.png' } as Express.Multer.File;

      jest.spyOn(repository, 'findOne').mockResolvedValue(brand);
      mockUploadService.uploadLogo.mockResolvedValue({
        url: 'http://localhost:9000/brand-logos/new.png',
        key: 'new.png',
        filename: 'new-logo.png',
        size: 100,
        mimetype: 'image/png',
      });
      jest.spyOn(repository, 'merge').mockReturnValue({
        ...brand,
        ...changes,
        logo: 'http://localhost:9000/brand-logos/new.png',
      });
      jest.spyOn(repository, 'save').mockResolvedValue(brand);
      jest.spyOn(repository, 'findOne').mockResolvedValue(brand);

      const { statusCode, data } = await service.update(
        id,
        userId,
        changes,
        mockFile,
      );
      expect(mockUploadService.deleteFile).not.toHaveBeenCalled();
      expect(mockUploadService.uploadLogo).toHaveBeenCalledWith(mockFile);
      expect(statusCode).toBe(200);
      expect(data).toEqual(mapBrandToResponseDto(brand));
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
