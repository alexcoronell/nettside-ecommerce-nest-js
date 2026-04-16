/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reflector, APP_INTERCEPTOR } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';

/* Modules */
import { AppModule } from '../../src/app.module';
import { SubcategoryModule } from '@subcategory/subcategory.module';
import { CategoryModule } from '@category/category.module';
import { UserModule } from '@user/user.module';

/* Entities */
import { Category } from '@category/entities/category.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* Faker */
import {
  createSubcategory,
  generateNewSubcategories,
} from '@faker/subcategory.faker';
import { generateCategory } from '@faker/category.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

describe('SubcategoryController (e2e) [GET]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoCategory: any = undefined;
  let repoUser: any = undefined;
  let adminCookies: string[];
  let sellerCookies: string[];
  let customerCookies: string[];
  let category: Category;
  let subcategories: Subcategory[] = [];
  const PATH = '/subcategory';

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
        SubcategoryModule,
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
    repo = app.get('SubcategoryRepository');
    repoCategory = app.get('CategoryRepository');
    repoUser = app.get('UserRepository');
  });

  beforeEach(async () => {
    await cleanDB();

    /* Login Users */
    const resLoginAdmin = await loginAdmin(app, repoUser);
    adminCookies = resLoginAdmin.cookies;
    const resLoginSeller = await loginSeller(app, repoUser);
    sellerCookies = resLoginSeller.cookies;
    const resLoginCustomer = await loginCustomer(app, repoUser);
    customerCookies = resLoginCustomer.cookies;

    /* Create category and 5 subcategories for testing */
    const newCategory = generateCategory();
    category = await repoCategory.save(newCategory);
    const newSubcategories = generateNewSubcategories(5, category.id);
    subcategories = await repo.save(newSubcategories);
  });

  describe('POST Subcategory', () => {
    it('/ should create a subcategory, return 201 and the subcategory with admin user', async () => {
      const newSubcategory = createSubcategory();
      const dto = {
        name: newSubcategory.name,
        categoryId: category.id,
      };
      const res = await request(app.getHttpServer())
        .post(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies)
        .send(dto);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(201);
      expect(data.name).toEqual(newSubcategory.name);
    });

    it('/ should return 401 if user is seller', async () => {
      const newSubcategory = createSubcategory();
      const res = await request(app.getHttpServer())
        .post(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies)
        .send(newSubcategory);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe('Unauthorized: Admin access required');
    });

    it('/ should return 401 if user is customer', async () => {
      const newSubcategory = createSubcategory();
      const res = await request(app.getHttpServer())
        .post(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies)
        .send(newSubcategory);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe('Unauthorized: Admin access required');
    });

    it('/ should return 401 if user is not logged', async () => {
      const newSubcategory = createSubcategory();
      const res = await request(app.getHttpServer())
        .post(`${PATH}`)
        .set('x-api-key', API_KEY)
        .send(newSubcategory);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Unauthorized');
    });

    it('/ should create a subcategory, return 401 if api key is missing', async () => {
      const newSubcategory = createSubcategory();
      const res = await request(app.getHttpServer())
        .post(`${PATH}`)
        .set('Cookie', adminCookies)
        .send(newSubcategory);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Invalid API key');
    });

    it('/ should return conflict if subcategory name already exists with the same category', async () => {
      const existingSubcategory = subcategories[0];

      const dto = {
        name: existingSubcategory.name,
        categoryId: category.id,
      };
      const res = await request(app.getHttpServer())
        .post('/subcategory')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies)
        .send(dto);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(409);
      expect(error).toBe('Conflict');
      expect(message).toBe(
        `The Subcategory NAME ${dto.name} is already in use with the same Category`,
      );
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
