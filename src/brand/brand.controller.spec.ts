/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234',
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  HeadBucketCommand: jest.fn(),
  CreateBucketCommand: jest.fn(),
}));

jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    done: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('@upload/constants/storage.constants', () => ({
  STORAGE_CONFIG: {
    endpoint: 'localhost:9000',
    region: 'us-east-1',
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    forcePathStyle: true,
  },
  BUCKETS: {
    BRAND_LOGOS: 'brand-logos',
    PRODUCT_IMAGES: 'product-images',
    AVATARS: 'avatars',
  },
  PUBLIC_URL_BASE: 'http://localhost:9000',
}));

/* Controller */
import { BrandController } from '@brand/brand.controller';

/* Services */
import { BrandService } from '@brand/brand.service';
import { UploadService } from '@upload/upload.service';

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
  let uploadService: UploadService;

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

  const mockUploadService = {
    uploadLogo: jest.fn().mockResolvedValue({
      url: 'http://localhost:9000/brand-logos/test-logo.png',
      key: 'brand-logos/test-logo.png',
      filename: 'test-logo.png',
      size: 1024,
      mimetype: 'image/png',
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandController],
      providers: [
        {
          provide: BrandService,
          useValue: mockService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    controller = module.get<BrandController>(BrandController);
    service = module.get<BrandService>(BrandService);
    uploadService = module.get<UploadService>(UploadService);
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
    it('should call create brand service without file', async () => {
      const userId = 1;
      await controller.create(mockNewBrand, undefined, userId);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith(mockNewBrand, userId);
    });

    it('should call create brand service with file', async () => {
      const userId = 1;
      const file = {
        originalname: 'logo.png',
        mimetype: 'image/png',
        buffer: Buffer.from('test'),
        size: 100,
      } as Express.Multer.File;

      await controller.create(mockNewBrand, file, userId);

      expect(uploadService.uploadLogo).toHaveBeenCalledWith(file);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update brand controller', () => {
    it('should call update brand service without file', async () => {
      const userId = 1;
      const changes = { name: 'newName' };
      await controller.update(1, changes, undefined, userId);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(service.update).toHaveBeenCalledWith(1, userId, changes);
    });

    it('should call update brand service with file', async () => {
      const userId = 1;
      const changes = { name: 'newName' };
      const file = {
        originalname: 'logo.png',
        mimetype: 'image/png',
        buffer: Buffer.from('test'),
        size: 100,
      } as Express.Multer.File;

      await controller.update(1, changes, file, userId);

      expect(uploadService.uploadLogo).toHaveBeenCalledWith(file);
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
