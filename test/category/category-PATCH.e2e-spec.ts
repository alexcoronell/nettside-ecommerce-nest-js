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
import { CategoryModule } from '@category/category.module';
import { UserModule } from '@user/user.module';

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* DTO's */
import { UpdateCategoryDto } from '@category/dto/update-category.dto';

/* Faker */
import { generateNewCategories } from '@faker/category.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

describe('CategoryController (e2e) [PATCH]', () => {
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

  describe('PATCH Category', () => {
    it('/:id should update a category with admin user', async () => {
      const newCategories = generateNewCategories(10);
      const dataNewCategories = await repo.save(newCategories);
      const id = dataNewCategories[0].id;
      const updatedData: UpdateCategoryDto = {
        name: 'Updated name',
        slug: 'updated-name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/category/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies)
        .send(updatedData);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.name).toBe(updatedData.name);
    });

    it('/:id should return 401 if the user is seller', async () => {
      const newCategories = generateNewCategories(10);
      const dataNewCategories = await repo.save(newCategories);
      const id = dataNewCategories[0].id;
      const updatedData: UpdateCategoryDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/category/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies)
        .send(updatedData);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/:id should return 401 if the user is customer', async () => {
      const newCategories = generateNewCategories(10);
      const dataNewCategories = await repo.save(newCategories);
      const id = dataNewCategories[0].id;
      const updatedData: UpdateCategoryDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/category/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies)
        .send(updatedData);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/:id should return Conflict if category name is already taken', async () => {
      const newCategories = await repo.save(generateNewCategories(10));

      const category = newCategories[0];
      const id = newCategories[1].id;

      const updatedData: UpdateCategoryDto = {
        name: category.name,
      };
      try {
        await request(app.getHttpServer())
          .patch(`/category/${id}`)
          .set('x-api-key', API_KEY)
          .set('Cookie', adminCookies)
          .send(updatedData);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          `The Category NAME ${updatedData.name} is already in use`,
        );
      }
    });

    it('/:id should return Conflict if category slug is already taken', async () => {
      const newCategories = await repo.save(generateNewCategories(10));

      const category = newCategories[0];
      const id = newCategories[1].id;

      const updatedData: UpdateCategoryDto = {
        slug: category.slug,
      };
      try {
        await request(app.getHttpServer())
          .patch(`/category/${id}`)
          .set('x-api-key', API_KEY)
          .set('Cookie', adminCookies)
          .send(updatedData);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          `The Category SLUG ${updatedData.slug} is already in use`,
        );
      }
    });

    it('should return 404 if category does not exist', async () => {
      const id = 9999;
      const updatedData: UpdateCategoryDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/category/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies)
        .send(updatedData);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(404);
      expect(message).toBe(`The Category with ID: ${id} not found`);
    });

    it('/:id should return 401 if api key is missing', async () => {
      const newCategories = generateNewCategories(10);
      const dataNewCategories = await repo.save(newCategories);
      const id = dataNewCategories[0].id;
      const updatedData: UpdateCategoryDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/category/${id}`)
        .set('Cookie', adminCookies)
        .send(updatedData);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Invalid API key');
    });

    it('/:id should return 401 if api key is invalid', async () => {
      const newCategories = generateNewCategories(10);
      const dataNewCategories = await repo.save(newCategories);
      const id = dataNewCategories[0].id;
      const updatedData: UpdateCategoryDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/category/${id}`)
        .set('x-api-key', 'invalid-api-key')
        .set('Cookie', adminCookies)
        .send(updatedData);
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
