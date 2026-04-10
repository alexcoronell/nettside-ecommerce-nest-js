import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import {
  S3Client,
  CreateBucketCommand,
  PutBucketPolicyCommand,
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
      await this.s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      await this.makeBucketPublic(bucketName);
      this.logger.log(`Bucket ${bucketName} created and made public`);
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (
        err.name === 'BucketAlreadyExists' ||
        err.name === 'BucketAlreadyOwnedByYou'
      ) {
        await this.makeBucketPublic(bucketName);
        this.logger.log(`Bucket ${bucketName} already exists, policy applied`);
      } else if (err.name === 'NotFound') {
        this.logger.warn(
          `Bucket ${bucketName} not found, will attempt to create`,
        );
        throw new HttpException(
          `Failed to create bucket: ${bucketName}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else {
        this.logger.warn(`Error ensuring bucket ${bucketName}: ${err.message}`);
      }
    }
  }

  private async makeBucketPublic(bucketName: string): Promise<void> {
    const publicReadPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject', 's3:GetObjectVersion'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
        {
          Sid: 'PublicListBucket',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:ListBucket', 's3:GetBucketLocation'],
          Resource: [`arn:aws:s3:::${bucketName}`],
        },
      ],
    };

    await this.s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(publicReadPolicy),
      }),
    );
    this.logger.log(`Bucket ${bucketName} made public`);
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
    return originalname.replace(/\s+/g, '-').substring(0, 200);
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
    const uniqueFilename = `${uuidv4()}---${sanitizedFilename}`;
    const key = uniqueFilename;

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

    const url = `${PUBLIC_URL_BASE}/${bucket}/${key}`;

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
