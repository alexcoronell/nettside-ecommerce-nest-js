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
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reflector, APP_INTERCEPTOR } from '@nestjs/core';

/* Modules */
import { AppModule } from '../../src/app.module';
import { CategoryModule } from '@category/category.module';
import { UserModule } from '@user/user.module';

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* Faker */
import { createCategory, generateNewCategories } from '@faker/category.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

describe('CategoryController (e2e) [GET]', () => {
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
        CategoryModule,
        UserModule,
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
    repo = app.get('CategoryRepository');
    repoUser = app.get('UserRepository');
    const categories = generateNewCategories(10);
    await repo.save(categories);
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

  describe('GET Category - Count', () => {
    it('/count should return 200 with admin cookies', async () => {
      const categories = generateNewCategories(10);
      await repo.save(categories);
      const res = await request(app.getHttpServer())
        .get('/category/count')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(categories.length);
    });

    it('/count should return 200 with seller cookies', async () => {
      const categories = generateNewCategories(10);
      await repo.save(categories);
      const res = await request(app.getHttpServer())
        .get('/category/count')
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(categories.length);
    });

    it('/count should return 401 with customer cookies', async () => {
      const res = await request(app.getHttpServer())
        .get('/category/count')
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Unauthorized: Customer access denied');
    });

    it('/count should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer()).get(
        '/category/count',
      );
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/count should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .get('/category/count')
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });
  });

  describe('GET Category - / Find', () => {
    it('/ should return all categories without logged user (public endpoint)', async () => {
      const categories = generateNewCategories(10);
      await repo.save(categories);
      const res = await request(app.getHttpServer())
        .get('/category')
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(categories.length);
      data.forEach((user) => {
        const category = categories.find((su) => su.name === user.name);
        expect(user).toEqual(
          expect.objectContaining({
            name: category?.name,
          }),
        );
      });
    });

    it('/ should return all categories with admin user', async () => {
      const categories = generateNewCategories(10);
      await repo.save(categories);
      const res = await request(app.getHttpServer())
        .get('/category')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(categories.length);
      data.forEach((user) => {
        const category = categories.find((su) => su.name === user.name);
        expect(user).toEqual(
          expect.objectContaining({
            name: category?.name,
          }),
        );
      });
    });

    it('/ should return all categories with seller user', async () => {
      const categories = generateNewCategories(10);
      await repo.save(categories);
      const res = await request(app.getHttpServer())
        .get('/category')
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(categories.length);
      data.forEach((user) => {
        const category = categories.find((su) => su.name === user.name);
        expect(user).toEqual(
          expect.objectContaining({
            name: category?.name,
          }),
        );
      });
    });

    it('/ should return all categories with customer user', async () => {
      const categories = generateNewCategories(10);
      await repo.save(categories);
      const res = await request(app.getHttpServer())
        .get('/category')
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(categories.length);
      data.forEach((user) => {
        const category = categories.find((su) => su.name === user.name);
        expect(user).toEqual(
          expect.objectContaining({
            name: category?.name,
          }),
        );
      });
    });

    it('/ should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer()).get('/category');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/ should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .get('/category')
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });
  });

  describe('GET Category - / FindOne', () => {
    it('/:id should return one category by id with admin user', async () => {
      const category = createCategory();
      const dataNewCategory = await repo.save(category);
      const res = await request(app.getHttpServer())
        .get(`/category/${dataNewCategory.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(dataNewCategory.id);
      expect(data.name).toEqual(dataNewCategory.name);
    });

    it('/:id should return one category by id with seller user', async () => {
      const category = createCategory();
      const dataNewCategory = await repo.save(category);
      const res = await request(app.getHttpServer())
        .get(`/category/${dataNewCategory.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(dataNewCategory.id);
      expect(data.name).toEqual(dataNewCategory.name);
    });

    it('/:id should return 401 by id with customer access token', async () => {
      const category = createCategory();
      const dataNewCategory = await repo.save(category);
      const res = await request(app.getHttpServer())
        .get(`/category/${dataNewCategory.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe('Unauthorized: Customer access denied');
    });

    it('/:id should return 404 by id if category does not exist', async () => {
      const category = createCategory();
      await repo.save(category);
      const res = await request(app.getHttpServer())
        .get(`/category/9999999`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(404);
      expect(error).toBe('Not Found');
      expect(message).toBe('The Category with ID: 9999999 not found');
    });

    it('/slug/:slug should return an category by slug with admin user', async () => {
      const category = createCategory();
      const dataNewCategory = await repo.save(category);
      const res = await request(app.getHttpServer())
        .get(`/category/slug/${dataNewCategory.slug}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(dataNewCategory.id);
      expect(data.name).toEqual(dataNewCategory.name);
    });

    it('/slug/:slug should return an category by slug with seller user', async () => {
      const category = createCategory();
      const dataNewCategory = await repo.save(category);
      const res = await request(app.getHttpServer())
        .get(`/category/slug/${dataNewCategory.slug}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(dataNewCategory.id);
      expect(data.slug).toEqual(dataNewCategory.slug);
    });

    it('/slug/:slug should return 401 with customer user', async () => {
      const category = createCategory();
      const savedCategory = await repo.save(category);
      const res = await request(app.getHttpServer())
        .get(`/category/slug/${savedCategory.slug}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe('Unauthorized: Customer access denied');
    });

    it('/slug/:slug should return 404 by slug if category does not exist', async () => {
      const category = createCategory();
      await repo.save(category);
      const res = await request(app.getHttpServer())
        .get(`/category/slug/not-existing-slug`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(404);
      expect(error).toBe('Not Found');
      expect(message).toBe(
        'The Category with SLUG: not-existing-slug not found',
      );
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDataSource();
  });
});
