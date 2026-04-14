/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { ProductImagesService } from '@product_images/product-images.service';

/* Entity */
import { ProductImage } from './entities/product-image.entity';
import { User } from '@user/entities/user.entity';

/* DTO */
import { UpdateProductImageDto } from './dto/update-product-image.dto';

/* Faker */
import {
  generateProductImage,
  generateManyProductImages,
} from '@faker/productImage.faker';

describe('ProductImagesService', () => {
  let service: ProductImagesService;
  let repository: Repository<ProductImage>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductImagesService,
        {
          provide: getRepositoryToken(ProductImage),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<ProductImagesService>(ProductImagesService);
    repository = module.get<Repository<ProductImage>>(
      getRepositoryToken(ProductImage),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('find product images services', () => {
    it('findAll should return all product Images with pagination', async () => {
      const mocks = generateManyProductImages(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks.slice(0, 10), mocks.length]);

      const { statusCode, data, meta } = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { title: 'ASC' },
        relations: ['product', 'uploadedBy', 'updatedBy'],
        skip: 0,
        take: 10,
      });
      expect(statusCode).toBe(200);
      expect(meta.total).toEqual(mocks.length);
      expect(data).toEqual(mocks.slice(0, 10));
    });

    it('findOne should return a product image', async () => {
      const mock = generateProductImage();
      const id = mock.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);

      const { statusCode, data } = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { id, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(mock);
    });

    it('findOne should throw NotFoundException if product image does not exist', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(
          `The Product Image with id: ${id} not found`,
        );
      }
    });

    it('findOne should throw NotFoundException if product image does not exist with Rejects', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrowError(
        new NotFoundException(`The Product Image with id: ${id} not found`),
      );
    });
  });

  describe('create product images services', () => {
    it('create should return a Product Image', async () => {
      const mock = generateProductImage();
      const userId: User['id'] = 1;
      const dto = {
        ...mock,
        product: mock.product.id,
        uploadedBy: userId,
      };
      jest.spyOn(repository, 'create').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, data } = await service.create(dto, userId);
      expect(statusCode).toBe(201);
      expect(data).toEqual(mock);
    });
  });

  describe('update product images services', () => {
    it('update should return message: have been modified', async () => {
      const mock: ProductImage = generateProductImage();
      const id = mock.id;
      const userId: User['id'] = 1;
      const changes: UpdateProductImageDto = { title: 'new title' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest.spyOn(repository, 'merge').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, message } = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(
        `The Product Image with ID: ${id} has been modified`,
      );
    });
  });
  describe('remove product image services', () => {
    it('remove should return status and message', async () => {
      const mock = generateProductImage();
      const id = mock.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...mock, isDeleted: true });
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, message } = await service.remove(id);
      expect(statusCode).toBe(200);
      expect(message).toEqual(
        `The Product Image with id: ${id} has been deleted`,
      );
    });

    it('remove should throw NotFoundException if Product Image does not exist with Rejects', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrowError(
        new NotFoundException(`The Product Image with id: ${id} not found`),
      );
    });
  });
});
