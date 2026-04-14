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

      expect(result.key).toContain('mock-uuid-1234');
      expect(result.key).toContain('test-logo.png');
    });

    it('should use product-images bucket as default', async () => {
      const result = await service.uploadFile(mockFile);

      expect(result.key).toContain('mock-uuid-1234');
      expect(result.key).toContain('test-logo.png');
    });
  });

  describe('uploadLogo', () => {
    it('should upload logo to brand-logos bucket', async () => {
      const result = await service.uploadLogo(mockFile);

      expect(result.key).toContain('mock-uuid-1234');
    });
  });

  describe('uploadProductImage', () => {
    it('should upload image to product-images bucket', async () => {
      const result = await service.uploadProductImage(mockFile);

      expect(result.key).toContain('mock-uuid-1234');
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar to avatars bucket', async () => {
      const result = await service.uploadAvatar(mockFile);

      expect(result.key).toContain('mock-uuid-1234');
    });
  });

  describe('ensureBucketExists', () => {
    it('should handle bucket existence check', async () => {
      await expect(
        service.ensureBucketExists(BUCKETS.BRAND_LOGOS),
      ).resolves.not.toThrow();
    });
  });

  describe('validateMimeType', () => {
    it('should reject file with invalid mime type', async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      await expect(
        service.uploadFile(invalidFile, BUCKETS.BRAND_LOGOS),
      ).rejects.toThrow("File type 'application/pdf' not allowed");
    });

    it('should accept valid image mime types', async () => {
      const validTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];

      for (const mimetype of validTypes) {
        const validFile = { ...mockFile, mimetype } as Express.Multer.File;
        const result = await service.uploadFile(validFile, BUCKETS.BRAND_LOGOS);
        expect(result).toHaveProperty('url');
      }
    });
  });

  describe('validateFileSize', () => {
    it('should reject file that exceeds max size', async () => {
      const largeFile = {
        ...mockFile,
        size: 6 * 1024 * 1024,
      } as Express.Multer.File;

      await expect(
        service.uploadFile(largeFile, BUCKETS.BRAND_LOGOS),
      ).rejects.toThrow('File size exceeds maximum allowed size');
    });
  });

  describe('sanitizeFilename', () => {
    it('should replace spaces with dashes in filename', async () => {
      const fileWithSpaces = {
        ...mockFile,
        originalname: 'test file name with spaces.png',
      } as Express.Multer.File;

      const result = await service.uploadFile(
        fileWithSpaces,
        BUCKETS.BRAND_LOGOS,
      );

      expect(result.key).toContain('test-file-name-with-spaces.png');
    });

    it('should handle multiple consecutive spaces', async () => {
      const fileWithMultipleSpaces = {
        ...mockFile,
        originalname: 'test    multiple   spaces.png',
      } as Express.Multer.File;

      const result = await service.uploadFile(
        fileWithMultipleSpaces,
        BUCKETS.BRAND_LOGOS,
      );

      expect(result.key).toContain('test-multiple-spaces.png');
    });

    it('should preserve special characters in filename', async () => {
      const fileWithSpecialChars = {
        ...mockFile,
        originalname: 'test@file#name$with%special^chars.png',
      } as Express.Multer.File;

      const result = await service.uploadFile(
        fileWithSpecialChars,
        BUCKETS.BRAND_LOGOS,
      );

      expect(result.key).toContain('test@file#name$with%special^chars.png');
    });

    it('should handle filename with path traversal attempt', async () => {
      const maliciousFile = {
        ...mockFile,
        originalname: '../../../etc/passwd.png',
      } as Express.Multer.File;

      const result = await service.uploadFile(
        maliciousFile,
        BUCKETS.BRAND_LOGOS,
      );

      expect(result.key).toContain('../../../etc/passwd.png');
    });
  });
});
