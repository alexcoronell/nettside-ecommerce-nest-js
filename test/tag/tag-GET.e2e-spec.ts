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
import { TagModule } from '@tag/tag.module';
import { UserModule } from '@user/user.module';

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* Faker */
import { createTag, generateNewTags } from '@faker/tag.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

describe('TagController (e2e) [GET]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoUser: any = undefined;
  let adminCookies: string[];
  let sellerCookies: string[];
  let customerCookies: string[];

  beforeAll(async () => {
    // Initialize database connection once for the entire test suite
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
        TagModule,
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
    repo = app.get('TagRepository');
    repoUser = app.get('UserRepository');
    const tags = generateNewTags(10);
    await repo.save(tags);
  });

  beforeEach(async () => {
    // Clean all data before each test to ensure isolation
    await cleanDB();

    /* Login Users */
    const resLoginAdmin = await loginAdmin(app, repoUser);
    adminCookies = resLoginAdmin.cookies;
    const resLoginSeller = await loginSeller(app, repoUser);
    sellerCookies = resLoginSeller.cookies;
    const resLoginCustomer = await loginCustomer(app, repoUser);
    customerCookies = resLoginCustomer.cookies;
  });

  describe('GET Tag - Count', () => {
    it('/count should return 200 with admin cookies', async () => {
      const tags = generateNewTags(10);
      await repo.save(tags);
      const res = await request(app.getHttpServer())
        .get('/tag/count')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(tags.length);
    });

    it('/count should return 200 with seller cookies', async () => {
      const tags = generateNewTags(10);
      await repo.save(tags);
      const res = await request(app.getHttpServer())
        .get('/tag/count')
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(tags.length);
    });

    it('/count should return 401 with customer cookies', async () => {
      const res = await request(app.getHttpServer())
        .get('/tag/count')
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Unauthorized: Customer access denied');
    });

    it('/count should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer()).get('/tag/count');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/count should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .get('/tag/count')
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });
  });

  describe('GET Tag - / Find', () => {
    it('/ should return all tags without logged user', async () => {
      const tags = generateNewTags(10);
      await repo.save(tags);
      const res = await request(app.getHttpServer())
        .get('/tag')
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(tags.length);
      data.forEach((user) => {
        const tag = tags.find((su) => su.name === user.name);
        expect(user).toEqual(
          expect.objectContaining({
            name: tag?.name,
          }),
        );
      });
    });

    it('/ should return all tags with admin cookies', async () => {
      const tags = generateNewTags(10);
      await repo.save(tags);
      const res = await request(app.getHttpServer())
        .get('/tag')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(tags.length);
      data.forEach((user) => {
        const tag = tags.find((su) => su.name === user.name);
        expect(user).toEqual(
          expect.objectContaining({
            name: tag?.name,
          }),
        );
      });
    });

    it('/ should return all tags with seller cookies', async () => {
      const tags = generateNewTags(10);
      await repo.save(tags);
      const res = await request(app.getHttpServer())
        .get('/tag')
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(tags.length);
      data.forEach((user) => {
        const tag = tags.find((su) => su.name === user.name);
        expect(user).toEqual(
          expect.objectContaining({
            name: tag?.name,
          }),
        );
      });
    });

    it('/ should return all tags with customer cookies', async () => {
      const tags = generateNewTags(10);
      await repo.save(tags);
      const res = await request(app.getHttpServer())
        .get('/tag')
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(tags.length);
      data.forEach((user) => {
        const tag = tags.find((su) => su.name === user.name);
        expect(user).toEqual(
          expect.objectContaining({
            name: tag?.name,
          }),
        );
      });
    });

    it('/ should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer()).get('/tag');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/ should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .get('/tag')
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });
  });

  describe('GET Tag - / FindOne', () => {
    it('/:id should return an tag by id with admin user', async () => {
      const tag = createTag();
      const dataNewTag = await repo.save(tag);
      const res = await request(app.getHttpServer())
        .get(`/tag/${dataNewTag.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(dataNewTag.id);
      expect(data.name).toEqual(dataNewTag.name);
    });

    it('/:id should return an tag by id with seller user', async () => {
      const tag = createTag();
      const dataNewTag = await repo.save(tag);
      const res = await request(app.getHttpServer())
        .get(`/tag/${dataNewTag.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(dataNewTag.id);
      expect(data.name).toEqual(dataNewTag.name);
    });

    it('/:id should return 401 by id with customer cookies', async () => {
      const tag = createTag();
      const dataNewTag = await repo.save(tag);
      const res = await request(app.getHttpServer())
        .get(`/tag/${dataNewTag.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe('Unauthorized: Customer access denied');
    });

    it('/:id should return 404 if tag does not exist', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tag/9999999`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(404);
      expect(error).toBe('Not Found');
      expect(message).toBe('The Tag with ID: 9999999 not found');
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
