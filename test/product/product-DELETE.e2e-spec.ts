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
    await repo.save(newProducts);
  });

  describe('DELETE Subcategory', () => {
    it('/:id should delete a Product with admin user', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode } = res.body;
      const deletedInDB = await repo.findOne({
        where: { id: ID, isDeleted: false },
      });
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(deletedInDB).toBeNull();
    });

    it('/:id should return 401 with seller user', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const deletedInDB = await repo.findOne({
        where: { id: ID, isDeleted: false },
      });
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
      expect(deletedInDB).toBeDefined();
    });

    it('/:id should return 401 with customer user', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const deletedInDB = await repo.findOne({
        where: { id: ID, isDeleted: false },
      });
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
      expect(deletedInDB).toBeDefined();
    });

    it('/:id should return 401 without user', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY);
      const deletedInDB = await repo.findOne({
        where: { id: ID, isDeleted: false },
      });
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.UNAUTHORIZED);
      expect(deletedInDB).toBeDefined();
    });

    it('/:id should return 401 with invalid api key', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${ID}`)
        .set('x-api-key', 'invalid-api-key')
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const deletedInDB = await repo.findOne({
        where: { id: ID, isDeleted: false },
      });
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
      expect(deletedInDB).toBeDefined();
    });

    it('/:id should return 401 if api key is missing', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${ID}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const deletedInDB = await repo.findOne({
        where: { id: ID, isDeleted: false },
      });
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
      expect(deletedInDB).toBeDefined();
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
