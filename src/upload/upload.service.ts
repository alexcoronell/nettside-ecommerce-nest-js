import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import {
  STORAGE_CONFIG,
  BUCKETS,
  PUBLIC_URL_BASE,
} from './constants/storage.constants';

export interface UploadResult {
  url: string;
  key: string;
  filename: string;
  size: number;
  mimetype: string;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client(STORAGE_CONFIG);
  }

  async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch (error) {
      this.logger.error(
        `Failed to check bucket ${bucketName}, attempting to create`,
        error instanceof Error ? error.stack : undefined,
      );
      try {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: bucketName }),
        );
      } catch (createError) {
        this.logger.error(
          `Failed to create bucket ${bucketName}`,
          createError instanceof Error ? createError.stack : undefined,
        );
        throw new HttpException(
          `Failed to create bucket: ${bucketName}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  private validateMimeType(mimetype: string): void {
    if (
      !ALLOWED_MIME_TYPES.includes(
        mimetype as (typeof ALLOWED_MIME_TYPES)[number],
      )
    ) {
      throw new HttpException(
        `File type '${mimetype}' not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateFileSize(size: number): void {
    if (size > MAX_FILE_SIZE) {
      throw new HttpException(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private sanitizeFilename(originalname: string): string {
    return originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 200);
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<UploadResult> {
    this.validateMimeType(file.mimetype);
    this.validateFileSize(file.size);

    const bucket = this.validateFolder(folder);

    await this.ensureBucketExists(bucket);

    const sanitizedFilename = this.sanitizeFilename(file.originalname);
    const uniqueFilename = `${uuidv4()}-${sanitizedFilename}`;
    const key = `${bucket}/${uniqueFilename}`;

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
    });

    await upload.done();

    const url = `${PUBLIC_URL_BASE}/${key}`;

    return {
      url,
      key,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  private validateFolder(folder: string): string {
    const validBuckets = Object.values(BUCKETS);

    if (
      validBuckets.includes(folder as (typeof BUCKETS)[keyof typeof BUCKETS])
    ) {
      return folder;
    }

    return BUCKETS.PRODUCT_IMAGES;
  }

  async uploadLogo(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, BUCKETS.BRAND_LOGOS);
  }

  async uploadProductImage(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, BUCKETS.PRODUCT_IMAGES);
  }

  async uploadAvatar(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadFile(file, BUCKETS.AVATARS);
  }
}
