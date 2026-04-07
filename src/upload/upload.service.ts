import { Injectable } from '@nestjs/common';
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

@Injectable()
export class UploadService {
  private readonly s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client(STORAGE_CONFIG);
  }

  async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch {
      await this.s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<UploadResult> {
    const bucket = this.validateFolder(folder);

    await this.ensureBucketExists(bucket);

    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
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
