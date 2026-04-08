/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';

/* Controller */
import { BrandController } from '@brand/brand.controller';

/* Services */
import { BrandService } from '@brand/brand.service';

/* Entities */
import { Brand } from '@brand/entities/brand.entity';

/* DTO's */
import { CreateBrandDto } from './dto/create-brand.dto';

/* Faker */
import {
  createBrand,
  generateBrand,
  generateManyBrands,
} from '@faker/brand.faker';

describe('BrandController', () => {
  let controller: BrandController;
  let service: BrandService;

  const mockBrand: Brand = generateBrand();
  const mockBrands: Brand[] = generateManyBrands(10);
  const mockNewBrand: CreateBrandDto = createBrand();

  const mockService = {
    countAll: jest.fn().mockResolvedValue(mockBrands.length),
    count: jest.fn().mockResolvedValue(mockBrands.length),
    findAll: jest.fn().mockResolvedValue(mockBrands),
    findAllWithRelations: jest.fn().mockResolvedValue(mockBrands),
    findOne: jest.fn().mockResolvedValue(mockBrand),
    findOneByName: jest.fn().mockResolvedValue(mockBrand),
    findOneBySlug: jest.fn().mockResolvedValue(mockBrand),
    create: jest.fn().mockResolvedValue(mockNewBrand),
    update: jest.fn().mockResolvedValue(1),
    remove: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandController],
      providers: [
        {
          provide: BrandService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<BrandController>(BrandController);
    service = module.get<BrandService>(BrandService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Count brand controllers', () => {
    it('should call count brand service', async () => {
      expect(await controller.count()).toBe(mockBrands.length);
      expect(service.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('Find brands controllers', () => {
    it('should call findAll brand service', async () => {
      expect(await controller.findAll()).toBe(mockBrands);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should call findOne brand service', async () => {
      expect(await controller.findOne(1)).toBe(mockBrand);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('create brand controller', () => {
    it('should call create brand service', async () => {
      const userId = 1;
      await controller.create(mockNewBrand, userId);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update brand controller', () => {
    it('should call update brand service', async () => {
      const userId = 1;
      const changes = { name: 'newName' };
      await controller.update(1, userId, changes);
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove brand controller', () => {
    it('shoudl call remove brand service', async () => {
      const userId = 1;
      await controller.remove(1, userId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
