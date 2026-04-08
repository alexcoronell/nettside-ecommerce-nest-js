import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandModule } from './brand.module';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { Brand } from './entities/brand.entity';

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

jest.mock('@upload/upload.service', () => ({
  UploadService: jest.fn().mockImplementation(() => ({
    uploadFile: jest.fn().mockResolvedValue({
      url: 'http://localhost:9000/brand-logos/test.png',
      key: 'brand-logos/test.png',
      filename: 'test.png',
      size: 1024,
      mimetype: 'image/png',
    }),
    uploadLogo: jest.fn().mockResolvedValue({
      url: 'http://localhost:9000/brand-logos/test.png',
      key: 'brand-logos/test.png',
      filename: 'test.png',
      size: 1024,
      mimetype: 'image/png',
    }),
  })),
}));

describe('Brand module', () => {
  let module: TestingModule;
  let service: BrandService;
  let controller: BrandController;
  let repository: Repository<Brand>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [BrandModule],
    })
      .overrideProvider(getRepositoryToken(Brand))
      .useValue({
        findOne: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        merge: jest.fn(),
      })
      .compile();

    service = module.get<BrandService>(BrandService);
    controller = module.get<BrandController>(BrandController);
    repository = module.get<Repository<Brand>>(getRepositoryToken(Brand));
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
    expect(repository).toBeDefined();
  });

  it('should have BrandService and BrandController', () => {
    expect(module.get(BrandService)).toBeInstanceOf(BrandService);
    expect(module.get(BrandController)).toBeInstanceOf(BrandController);
  });

  it('should inject TypeORM repository for Brand', () => {
    expect(module.get(getRepositoryToken(Brand))).toBeDefined();
  });
});
