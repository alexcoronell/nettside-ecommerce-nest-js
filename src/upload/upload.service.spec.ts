import { Test, TestingModule } from '@nestjs/testing';

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234',
}));

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
    })),
    HeadBucketCommand: jest.fn(),
    CreateBucketCommand: jest.fn(),
  };
});

jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    done: jest.fn().mockResolvedValue({}),
  })),
}));

import { UploadService } from '@upload/upload.service';
import { BUCKETS } from '@upload/constants/storage.constants';

describe('UploadService', () => {
  let service: UploadService;

  const mockFile = {
    originalname: 'test-logo.png',
    mimetype: 'image/png',
    buffer: Buffer.from('test-buffer'),
    size: 1024,
    fieldname: 'file',
    encoding: '7bit',
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file successfully with valid bucket', async () => {
      const result = await service.uploadFile(mockFile, BUCKETS.BRAND_LOGOS);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('mimetype');
      expect(result.filename).toBe(mockFile.originalname);
      expect(result.size).toBe(mockFile.size);
      expect(result.mimetype).toBe(mockFile.mimetype);
    });

    it('should return product-images bucket for invalid folder', async () => {
      const result = await service.uploadFile(mockFile, 'invalid-folder');

      expect(result.key).toContain(BUCKETS.PRODUCT_IMAGES);
    });

    it('should use product-images bucket as default', async () => {
      const result = await service.uploadFile(mockFile);

      expect(result.key).toContain(BUCKETS.PRODUCT_IMAGES);
    });
  });

  describe('uploadLogo', () => {
    it('should upload logo to brand-logos bucket', async () => {
      const result = await service.uploadLogo(mockFile);

      expect(result.key).toContain(BUCKETS.BRAND_LOGOS);
    });
  });

  describe('uploadProductImage', () => {
    it('should upload image to product-images bucket', async () => {
      const result = await service.uploadProductImage(mockFile);

      expect(result.key).toContain(BUCKETS.PRODUCT_IMAGES);
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar to avatars bucket', async () => {
      const result = await service.uploadAvatar(mockFile);

      expect(result.key).toContain(BUCKETS.AVATARS);
    });
  });

  describe('ensureBucketExists', () => {
    it('should handle bucket existence check', async () => {
      await expect(
        service.ensureBucketExists(BUCKETS.BRAND_LOGOS),
      ).resolves.not.toThrow();
    });
  });
});
