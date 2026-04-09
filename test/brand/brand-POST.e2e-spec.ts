/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reflector, APP_INTERCEPTOR } from '@nestjs/core';

/* Modules */
import { AppModule } from '../../src/app.module';
import { BrandModule } from '@brand/brand.module';
import { UserModule } from '@user/user.module';
import { UploadModule } from '@upload/upload.module';

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* Faker */
import { createBrand, generateNewBrands } from '@faker/brand.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

describe('BrandController (e2e) [POST]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoUser: any = undefined;
  let adminCookies: string[];
  let sellerCookies: string[];
  let customerCookies: string[];

  beforeAll(async () => {
    await initDataSource();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.e2e',
        }),
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            synchronize: true,
            ...dataSource.options,
          }),
        }),
        AppModule,
        BrandModule,
        UserModule,
        UploadModule,
      ],
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useClass: AuditInterceptor,
        },
        Reflector,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
    repo = app.get('BrandRepository');
    repoUser = app.get('UserRepository');
    const brands = generateNewBrands(10);
    await repo.save(brands);
  });

  beforeEach(async () => {
    await cleanDB();

    const resLoginAdmin = await loginAdmin(app, repoUser);
    adminCookies = resLoginAdmin.cookies;

    const resLoginSeller = await loginSeller(app, repoUser);
    sellerCookies = resLoginSeller.cookies;

    const resLoginCustomer = await loginCustomer(app, repoUser);
    customerCookies = resLoginCustomer.cookies;
  });

  describe('POST Brand', () => {
    it('/ should create a brand with multipart form data, return 201', async () => {
      const newBrand = createBrand();
      const res = await request(app.getHttpServer())
        .post('/brand')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies)
        .field('name', String(newBrand.name))
        .field('slug', String(newBrand.slug));
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(201);
      expect(data.name).toEqual(newBrand.name);
    });

    it('/ should create a brand without logo, return 201', async () => {
      const newBrand = createBrand();
      const res = await request(app.getHttpServer())
        .post('/brand')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies)
        .field('name', newBrand.name)
        .field('slug', newBrand.slug);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(201);
      expect(data.logo).toBeNull();
    });

    it('/ should create a brand with logo file, return 201', async () => {
      const newBrand = createBrand();
      const res = await request(app.getHttpServer())
        .post('/brand')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies)
        .field('name', newBrand.name)
        .field('slug', newBrand.slug)
        .attach('file', Buffer.from('fake-image-content'), 'logo.png');
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(201);
      expect(data.logo).toContain('brand-logos/');
    });

    it('/ should return 401 if user is seller', async () => {
      const newBrand = createBrand();
      const res = await request(app.getHttpServer())
        .post('/brand')
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies)
        .field('name', newBrand.name)
        .field('slug', newBrand.slug);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/ should return 401 if user is customer', async () => {
      const newBrand = createBrand();
      const res = await request(app.getHttpServer())
        .post('/brand')
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies)
        .field('name', newBrand.name)
        .field('slug', newBrand.slug);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/ should return a conflict exception with existing brand name', async () => {
      const newBrand = createBrand();
      await repo.save(newBrand);
      const repeatedBrand = {
        ...createBrand(),
        name: newBrand.name,
      };
      try {
        await request(app.getHttpServer())
          .post('/brand')
          .set('x-api-key', API_KEY)
          .set('Cookie', adminCookies)
          .field('name', repeatedBrand.name)
          .field('slug', repeatedBrand.slug);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          `The Brand NAME ${repeatedBrand.name} is already in use`,
        );
      }
    });

    it('/ should return 401 if api key is missing', async () => {
      const newBrand = createBrand();
      const res = await request(app.getHttpServer())
        .post('/brand')
        .set('Cookie', adminCookies)
        .field('name', newBrand.name)
        .field('slug', newBrand.slug);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Invalid API key');
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDataSource();
  });
});
