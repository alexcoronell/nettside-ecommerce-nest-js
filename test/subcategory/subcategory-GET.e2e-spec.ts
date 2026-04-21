/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as cookieParser from 'cookie-parser';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reflector, APP_INTERCEPTOR } from '@nestjs/core';

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
import { generateNewSubcategories } from '@faker/subcategory.faker';
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

  describe('GET Subcategory - Count', () => {
    it('/count should return 200 with admin access token', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/count`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(subcategories.length);
    });

    it('/count should return 200 with seller access token', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/count`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(subcategories.length);
    });

    it('/count should return 401 with customer access token', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/count`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Unauthorized: Customer access denied');
    });

    it('/count should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer()).get(`${PATH}/count`);
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/count should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .get(`${PATH}/count`)
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });
  });

  describe('GET Subcategory - /all FindAllNoPagination', () => {
    it('/all should return all subcategory names without authentication (public endpoint)', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/all`)
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toEqual(subcategories.length);
      // Verify response contains only id and name
      data.forEach((subcat: any) => {
        expect(subcat).toHaveProperty('id');
        expect(subcat).toHaveProperty('name');
        expect(subcat).not.toHaveProperty('slug');
        expect(subcat).not.toHaveProperty('isDeleted');
      });
    });

    it('/all should return empty array when no subcategories exist', async () => {
      // Clean all subcategories first
      await repo.remove(await repo.find());
      const res = await request(app.getHttpServer())
        .get(`${PATH}/all`)
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data).toHaveLength(0);
    });

    it('/all should return 401 if api key is missing', async () => {
      const res = await request(app.getHttpServer()).get(`${PATH}/all`);
      const { statusCode } = res.body;
      expect(statusCode).toBe(401);
    });

    it('/all should return 401 if api key is invalid', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/all`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode } = res.body;
      expect(statusCode).toBe(401);
    });
  });

  describe('GET Subcategory - / Find (PUBLIC)', () => {
    it('/ should return 200 and all subcategories WITHOUT auth (public)', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(subcategories.length);
      data.forEach((user) => {
        const subcategory = subcategories.find((su) => su.name === user.name);
        expect(user).toEqual(
          expect.objectContaining({
            name: subcategory?.name,
          }),
        );
      });
    });

    it('/ should return 401 without api key (public)', async () => {
      const res = await request(app.getHttpServer()).get(`${PATH}`);
      const { statusCode } = res.body;
      expect(statusCode).toBe(401);
    });
  });

  describe('GET Subcategory - / Find ByCategory', () => {
    it('/category/:category should return the subcategories by category with admin user', async () => {
      const categoryId = category.id;
      const dataByCategory = await repo.find({
        where: { category: { id: categoryId }, isDeleted: false },
      });
      const res = await request(app.getHttpServer())
        .get(`${PATH}/category/${categoryId}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(dataByCategory.length);
      data.forEach((data) => {
        const subcategory = subcategories.find((su) => su.name === data.name);
        expect(data).toEqual(
          expect.objectContaining({
            name: subcategory?.name,
          }),
        );
      });
    });

    it('/category/:category should return the subcategories by category with seller user', async () => {
      const categoryId = category.id;
      const dataByCategory = await repo.find({
        where: { category: { id: categoryId }, isDeleted: false },
      });
      const res = await request(app.getHttpServer())
        .get(`${PATH}/category/${categoryId}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(dataByCategory.length);
      data.forEach((data) => {
        const subcategory = subcategories.find((su) => su.name === data.name);
        expect(data).toEqual(
          expect.objectContaining({
            name: subcategory?.name,
          }),
        );
      });
    });

    it('/category/:category should return the subcategories by category with customer user', async () => {
      const categoryId = category.id;
      const dataByCategory = await repo.find({
        where: { category: { id: categoryId }, isDeleted: false },
      });
      const res = await request(app.getHttpServer())
        .get(`${PATH}/category/${categoryId}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(dataByCategory.length);
      data.forEach((data) => {
        const subcategory = subcategories.find((su) => su.name === data.name);
        expect(data).toEqual(
          expect.objectContaining({
            name: subcategory?.name,
          }),
        );
      });
    });

    it('/category/:category should return the subcategories by category without user', async () => {
      const categoryId = category.id;
      const dataByCategory = await repo.find({
        where: { category: { id: categoryId }, isDeleted: false },
      });
      const res = await request(app.getHttpServer())
        .get(`${PATH}/category/${categoryId}`)
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(dataByCategory.length);
      data.forEach((data) => {
        const subcategory = subcategories.find((su) => su.name === data.name);
        expect(data).toEqual(
          expect.objectContaining({
            name: subcategory?.name,
          }),
        );
      });
    });

    it('/ should return 401 if api key is missing', async () => {
      const categoryId = category.id;
      const data: any = await request(app.getHttpServer()).get(
        `${PATH}/category/${categoryId}`,
      );
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/ should return 401 if api key is invalid', async () => {
      const categoryId = category.id;
      const data: any = await request(app.getHttpServer())
        .get(`${PATH}/category/${categoryId}`)
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/:id should return 404 by id if subcategory does not exist with admin user', async () => {
      const id = 9999;
      const res = await request(app.getHttpServer())
        .get(`${PATH}/category/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toBe(0);
    });
  });

  describe('GET Subcategory - / FindOne', () => {
    it('/:id should return an subcategory by id with admin user', async () => {
      const subcategory = subcategories[0];
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${subcategory.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(subcategory.id);
      expect(data.name).toEqual(subcategory.name);
    });

    it('/:id should return 401 by id with seller user', async () => {
      const subcategory = subcategories[0];
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${subcategory.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe('Unauthorized: Admin access required');
    });

    it('/:id should return 401 by id with customer access token', async () => {
      const subcategory = subcategories[0];
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${subcategory.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe('Unauthorized: Admin access required');
    });

    it('/ should return 401 if api key is missing', async () => {
      const subcategory = subcategories[0];
      const data: any = await request(app.getHttpServer()).get(
        `${PATH}/${subcategory.id}`,
      );
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/ should return 401 if api key is invalid', async () => {
      const subcategory = subcategories[0];
      const data: any = await request(app.getHttpServer())
        .get(`${PATH}/${subcategory.id}`)
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/:id should return 404 by id if subcategory does not exist with admin user', async () => {
      const id = 9999;
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(404);
      expect(error).toBe('Not Found');
      expect(message).toBe(`The Subcategory with ID: ${id} not found`);
    });
  });

  describe('GET Subcategory - / FindOneBySlug', () => {
    it('/slug/:slug should return an subcategory by slug with admin user', async () => {
      const category = subcategories[0];
      const slug = subcategories[0].slug;
      const res = await request(app.getHttpServer())
        .get(`${PATH}/slug/${slug}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(category.id);
      expect(data.name).toEqual(category.name);
      expect(data.isDeleted).toBeFalsy();
    });

    it('/slug/:slug should return 401 by slug with seller user', async () => {
      const slug = subcategories[0].slug;
      const res = await request(app.getHttpServer())
        .get(`${PATH}/slug/${slug}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe('Unauthorized: Admin access required');
    });

    it('/slug/:slug should return 401 by slug with customer access token', async () => {
      const slug = subcategories[0].slug;
      const res = await request(app.getHttpServer())
        .get(`${PATH}/slug/${slug}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe('Unauthorized: Admin access required');
    });

    it('/slug/:slug should return 401 if api key is missing', async () => {
      const slug = subcategories[0].slug;
      const data: any = await request(app.getHttpServer()).get(
        `${PATH}/slug/${slug}`,
      );
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/slug/:slug should return 401 if api key is invalid', async () => {
      const slug = subcategories[0].slug;
      const data: any = await request(app.getHttpServer())
        .get(`${PATH}/slug/${slug}`)
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/slug/:slug should return 404 by slug if subcategory does not exist with admin user', async () => {
      const slug = 'non-existing-slug';
      const res = await request(app.getHttpServer())
        .get(`${PATH}/slug/${slug}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(404);
      expect(error).toBe('Not Found');
      expect(message).toBe(`The Subcategory with SLUG: ${slug} not found`);
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
