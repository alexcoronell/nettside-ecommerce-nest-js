/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, INestApplication } from '@nestjs/common';
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
import { createProduct } from '../../faker/product.faker';
import { CreateProductDto } from '@product/dto/create-product.dto';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/product';

describe('ProductController (e2e) [POST]', () => {
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
  });

  describe('POST Product', () => {
    it('/ should create a product, return 201 with admin user', async () => {
      const newProduct = createProduct();
      const dto: CreateProductDto = {
        ...newProduct,
        brand: brand.id,
        category: category.id,
        subcategory: subcategory.id,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.CREATED);
      expect(data.name).toEqual(dto.name);
    });

    it('/ should return 401 with seller user', async () => {
      const newProduct = createProduct();
      const dto: CreateProductDto = {
        ...newProduct,
        brand: brand.id,
        category: category.id,
        subcategory: subcategory.id,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`)
        .send(dto);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('/ should return 401 with customer user', async () => {
      const newProduct = createProduct();
      const dto: CreateProductDto = {
        ...newProduct,
        brand: brand.id,
        category: category.id,
        subcategory: subcategory.id,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(dto);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('/ should return 401 without user', async () => {
      const newProduct = createProduct();
      const dto: CreateProductDto = {
        ...newProduct,
        brand: brand.id,
        category: category.id,
        subcategory: subcategory.id,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .send(dto);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('/ should not create a product, return 401 with invalid api key', async () => {
      const newProduct = createProduct();
      const dto: CreateProductDto = {
        ...newProduct,
        brand: brand.id,
        category: category.id,
        subcategory: subcategory.id,
      };
      const res = await request(app.getHttpServer())
        .post(`${PATH}`)
        .set('x-api-key', 'invalid-api-key')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should not create a product, return 401 if api key is missing', async () => {
      const newProduct = createProduct();
      const dto: CreateProductDto = {
        ...newProduct,
        brand: brand.id,
        category: category.id,
        subcategory: subcategory.id,
      };
      const res = await request(app.getHttpServer())
        .post(`${PATH}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should return conflict if product name already exists', async () => {
      const newProducts = generateNewProducts(
        5,
        category.id,
        subcategory.id,
        brand.id,
      );
      const products = await repo.save(newProducts);

      const newProduct = createProduct();
      const dto: CreateProductDto = {
        ...newProduct,
        name: products[0].name,
        brand: brand.id,
        category: category.id,
        subcategory: subcategory.id,
      };

      try {
        await request(app.getHttpServer()).post(PATH).send(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          `The Product NAME ${dto.name} is already in use`,
        );
      }
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
