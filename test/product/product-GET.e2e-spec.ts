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

/* Modules */
import { AppModule } from '../../src/app.module';
import { SubcategoryModule } from '@subcategory/subcategory.module';
import { CategoryModule } from '@category/category.module';
import { UserModule } from '@user/user.module';

/* Entities */
import { Brand } from '@brand/entities/brand.entity';
import { Category } from '@category/entities/category.entity';
import { Product } from '@product/entities/product.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

import {
  ERROR_MESSAGES,
  ERRORS,
  HTTP_STATUS,
} from '../../src/commons/constants';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* Faker */
import { createBrand } from '@faker/brand.faker';
import { createCategory } from '@faker/category.faker';
import { createSubcategory } from '@faker/subcategory.faker';
import { generateNewProducts } from '@faker/product.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/product';
const COUNT_ALL = `${PATH}/count-all`;
const COUNT = `${PATH}/count`;
const FIND_BY_NAME = `${PATH}/name`;
const FIND_BY_BRAND = `${PATH}/brand`;
const FIND_BY_CATEGORY = `${PATH}/category`;
const ID = 1;

describe('ProductController (e2e) [GET]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoBrand: any = undefined;
  let repoCategory: any = undefined;
  let repoSubcategory: any = undefined;
  let repoUser: any = undefined;
  let adminAccessToken: string;
  let sellerAccessToken: string;
  let customerAccessToken: string;
  let brand: Brand;
  let category: Category;
  let subcategory: Subcategory;
  let products: Product[] = [];

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
    await app.init();
    repo = app.get('ProductRepository');
    repoBrand = app.get('BrandRepository');
    repoSubcategory = app.get('SubcategoryRepository');
    repoCategory = app.get('CategoryRepository');
    repoUser = app.get('UserRepository');
  });

  beforeEach(async () => {
    // Clean all data before each test to ensure isolation
    await cleanDB();

    /* Login Users */
    const resLoginAdmin = await loginAdmin(app, repoUser);
    adminAccessToken = resLoginAdmin.access_token;
    const resLoginSeller = await loginSeller(app, repoUser);
    sellerAccessToken = resLoginSeller.access_token;
    const resLoginCustomer = await loginCustomer(app, repoUser);
    customerAccessToken = resLoginCustomer.access_token;

    /* Create brand, category, subcategory  and 5 products for testing */
    const newBrand = createBrand();
    brand = await repoBrand.save(newBrand);

    const newCategory = createCategory();
    category = await repoCategory.save(newCategory);

    const newSubcategories = createSubcategory(category.id);
    subcategory = await repoSubcategory.save(newSubcategories);

    const newProducts = generateNewProducts(
      5,
      brand.id,
      category.id,
      subcategory.id,
    );
    products = await repo.save(newProducts);
  });

  xdescribe('GET Product - Count-All', () => {
    it('/count-all should return 401 if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(COUNT_ALL);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/count-all should return 401 if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(COUNT_ALL)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/count-all should return 200 with admin access token', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT_ALL)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(total).toEqual(products.length);
    });

    it('/count-all should return 401 with seller access token', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT_ALL)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, message, error, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
      expect(total).toBeUndefined();
    });

    it('/count-all should return 401 with customer access token', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT_ALL)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, message, error, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
      expect(total).toBeUndefined();
    });

    it('/count-all should return 401 without access token', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT_ALL)
        .set('x-api-key', API_KEY);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(total).toBeUndefined();
    });
  });

  xdescribe('GET Product - Count', () => {
    it('/count-all should return 401 if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(COUNT);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/count-all should return 401 if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/count-all should return 200 and total with admin access token', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(total).toEqual(products.length);
    });

    it('/count-all should return 200 and total with seller access token', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(total).toEqual(products.length);
    });

    it('/count-all should return 200 and total with customer access token', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(total).toEqual(products.length);
    });

    it('/count-all should return 200 and total without access token', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', API_KEY);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(total).toEqual(products.length);
    });
  });

  xdescribe('GET Product - Find', () => {
    it('/ should return 401 if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(`${PATH}`);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should return 401 if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should return all products with admin user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(products.length);
      data.forEach((item) => {
        const product = products.find((su) => su.name === item.name);
        expect(item).toEqual(
          expect.objectContaining({
            name: product?.name,
          }),
        );
      });
    });

    it('/ should return all products with seller user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(products.length);
      data.forEach((item) => {
        const product = products.find((su) => su.name === item.name);
        expect(item).toEqual(
          expect.objectContaining({
            name: product?.name,
          }),
        );
      });
    });

    it('/ should return all products with customer user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(products.length);
      data.forEach((item) => {
        const product = products.find((su) => su.name === item.name);
        expect(item).toEqual(
          expect.objectContaining({
            name: product?.name,
          }),
        );
      });
    });

    it('/ should return all products without user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(products.length);
      data.forEach((item) => {
        const product = products.find((su) => su.name === item.name);
        expect(item).toEqual(
          expect.objectContaining({
            name: product?.name,
          }),
        );
      });
    });
  });

  xdescribe('GET Product - Find By Id', () => {
    it('/ should return 401 if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(`${PATH}/${ID}`);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should return 401 if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/:id should return 401 without user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
    });

    it('/:id should return a product by id with admin user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.id).toBeDefined();
      expect(data.name).toBeDefined();
    });

    it('/:id should return a product by id with seller user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.id).toBeDefined();
      expect(data.name).toBeDefined();
    });

    it('/:id should return 401 with customer user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.CUSTOMER_DENIED);
      expect(data).toBeUndefined();
    });

    it('/:id should return a 404', async () => {
      const ID = 9999;
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data, message, error } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data).toBeUndefined();
      expect(error).toBe(ERROR_MESSAGES.NOT_FOUND);
      expect(message).toBe(`The Product with ID: ${ID} not found`);
    });
  });

  xdescribe('GET Product - Find By name', () => {
    it('/ should return 401 if api key is missing', async () => {
      const name = products[0].name;
      const res: any = await request(app.getHttpServer()).get(
        `${FIND_BY_NAME}/${name}`,
      );
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should return 401 if api key is invalid', async () => {
      const name = products[0].name;
      const res: any = await request(app.getHttpServer())
        .get(`${FIND_BY_NAME}/${name}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/name/:name should return a product by name with admin user', async () => {
      const name = products[0].name;
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_NAME}/${name}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data.name).toBe(name);
    });

    it('/name/:name should return a product by name with seller user', async () => {
      const name = products[0].name;
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_NAME}/${name}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data.name).toBe(name);
    });

    it('/name/:name should return a product by name with customer user', async () => {
      const name = products[0].name;
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_NAME}/${name}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data.name).toBe(name);
    });

    it('/name/:name should return a product by name without user', async () => {
      const name = products[0].name;
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_NAME}/${name}`)
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data.name).toBe(name);
    });

    it('/name/:name should return 404 by name not found product', async () => {
      const name = 'NonExistentProductName';
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_NAME}/${name}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data, message, error } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data).toBeUndefined();
      expect(error).toBe(ERROR_MESSAGES.NOT_FOUND);
      expect(message).toBe(`The Product with NAME: ${name} not found`);
    });
  });

  xdescribe('GET Product - Find By Brand', () => {
    it('/brand/:slug should return 401 if api key is missing', async () => {
      const slug = brand.slug;
      const res: any = await request(app.getHttpServer()).get(
        `${FIND_BY_BRAND}/${slug}`,
      );
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/brand/:slug should return 401 if api key is invalid', async () => {
      const slug = brand.slug;
      const res: any = await request(app.getHttpServer())
        .get(`${FIND_BY_BRAND}/${slug}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/brand/:slug should return an array of product by brand slug with admin user', async () => {
      const slug = brand.slug;
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_BRAND}/${slug}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data[0].brand.slug).toEqual(slug);
    });

    it('/brand/:slug should return an array of product by brand slug with seller user', async () => {
      const slug = brand.slug;
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_BRAND}/${slug}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data[0].brand.slug).toEqual(slug);
    });

    it('/brand/:slug should return an array of product by brand slug with customer user', async () => {
      const slug = brand.slug;
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_BRAND}/${slug}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data[0].brand.slug).toEqual(slug);
    });

    it('/brand/:slug should return an array of product by brand slug without user', async () => {
      const slug = brand.slug;
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_BRAND}/${slug}`)
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data[0].brand.slug).toEqual(slug);
    });

    it('/brand/:slug should return an empty array of product by slug with no existing brand', async () => {
      const slug = 'no-existing-brand';
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_BRAND}/${slug}`)
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data).toEqual([]);
    });
  });

  describe('GET Product - Find By Category', () => {
    it('/brand/:slug should return 401 if api key is missing', async () => {
      const slug = category.slug;
      const res: any = await request(app.getHttpServer()).get(
        `${FIND_BY_CATEGORY}/${slug}`,
      );
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/brand/:slug should return 401 if api key is invalid', async () => {
      const slug = category.slug;
      const res: any = await request(app.getHttpServer())
        .get(`${FIND_BY_CATEGORY}/${slug}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/brand/:slug should return an array of product by category slug with admin user', async () => {
      const slug = category.slug;
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_CATEGORY}/${slug}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data[0].category.slug).toEqual(slug);
    });

    it('/brand/:slug should return an array of product by category slug with seller user', async () => {
      const slug = category.slug;
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_CATEGORY}/${slug}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data[0].category.slug).toEqual(slug);
    });

    it('/brand/:slug should return an array of product by category slug with customer user', async () => {
      const slug = category.slug;
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_CATEGORY}/${slug}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data[0].category.slug).toEqual(slug);
    });

    it('/brand/:slug should return an array of product by category slug without user', async () => {
      const slug = category.slug;
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_CATEGORY}/${slug}`)
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data[0].category.slug).toEqual(slug);
    });

    it('/brand/:slug should return an empty array of product by slug with no existing brand', async () => {
      const slug = 'no-existing-brand';
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_CATEGORY}/${slug}`)
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data).toEqual([]);
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
