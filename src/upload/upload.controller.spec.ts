/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from '@upload/upload.controller';
import { UploadService } from '@upload/upload.service';

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234',
}));

describe('UploadController', () => {
  let controller: UploadController;
  let uploadService: UploadService;

  const mockUploadResult = {
    url: 'http://localhost:9000/brand-logos/mock-uuid-test-logo.png',
    key: 'brand-logos/mock-uuid-test-logo.png',
    filename: 'test-logo.png',
    size: 1024,
    mimetype: 'image/png',
  };

  const mockFile = {
    originalname: 'test-logo.png',
    mimetype: 'image/png',
    buffer: Buffer.from('test-buffer'),
    size: 1024,
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue(mockUploadResult),
            uploadLogo: jest.fn().mockResolvedValue(mockUploadResult),
            uploadProductImage: jest.fn().mockResolvedValue(mockUploadResult),
            uploadAvatar: jest.fn().mockResolvedValue(mockUploadResult),
          },
        },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    uploadService = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(uploadService).toBeDefined();
  });

  describe('uploadGeneric', () => {
    it('should call uploadService.uploadFile with folder parameter', async () => {
      const result = await controller.uploadGeneric(mockFile, 'brand-logos');

      expect(uploadService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'brand-logos',
      );
      expect(result).toEqual(mockUploadResult);
    });

    it('should call uploadService.uploadFile without folder parameter', async () => {
      const result = await controller.uploadGeneric(mockFile, undefined);

      expect(uploadService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        undefined,
      );
      expect(result).toEqual(mockUploadResult);
    });
  });

  describe('uploadLogo', () => {
    it('should call uploadService.uploadLogo', async () => {
      const result = await controller.uploadLogo(mockFile);

      expect(uploadService.uploadLogo).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockUploadResult);
    });
  });

  describe('uploadProductImage', () => {
    it('should call uploadService.uploadProductImage', async () => {
      const result = await controller.uploadProductImage(mockFile);

      expect(uploadService.uploadProductImage).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockUploadResult);
    });
  });

  describe('uploadAvatar', () => {
    it('should call uploadService.uploadAvatar', async () => {
      const result = await controller.uploadAvatar(mockFile);

      expect(uploadService.uploadAvatar).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockUploadResult);
    });
  });
});
