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
import { Discount } from '@discount/entities/discount.entity';
import { Product } from '@product/entities/product.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';
import { User } from '@user/entities/user.entity';

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
import { createDiscount } from '@faker/discount.faker';
import { generateNewProducts } from '@faker/product.faker';
import { generateManyProductDiscountE2E } from '@faker/productDiscount.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/product-discount';

describe('ProductController (e2e) [GET]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoBrand: any = undefined;
  let repoCategory: any = undefined;
  let repoDiscount: any = undefined;
  let repoProduct: any = undefined;
  let repoSubcategory: any = undefined;
  let repoUser: any = undefined;
  let adminUser: User;
  let adminAccessToken: string;
  let sellerAccessToken: string;
  let customerAccessToken: string;
  let brand: Brand;
  let category: Category;
  let discount: Discount;
  let product: Product;
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
    repo = app.get('ProductDiscountRepository');
    repoBrand = app.get('BrandRepository');
    repoCategory = app.get('CategoryRepository');
    repoDiscount = app.get('DiscountRepository');
    repoProduct = app.get('ProductRepository');
    repoSubcategory = app.get('SubcategoryRepository');
    repoUser = app.get('UserRepository');
  });

  beforeEach(async () => {
    // Clean all data before each test to ensure isolation
    await cleanDB();

    /* Login Users */
    const resLoginAdmin = await loginAdmin(app, repoUser);
    adminAccessToken = resLoginAdmin.access_token;
    adminUser = resLoginAdmin.adminUser;
    const resLoginSeller = await loginSeller(app, repoUser);
    sellerAccessToken = resLoginSeller.access_token;
    const resLoginCustomer = await loginCustomer(app, repoUser);
    customerAccessToken = resLoginCustomer.access_token;

    /* Create brand, category, subcategory  and 5 products for testing */
    const newBrand = createBrand();
    brand = await repoBrand.save(newBrand);

    const newCategory = createCategory();
    category = await repoCategory.save(newCategory);

    const newDiscount = createDiscount();
    discount = await repoDiscount.save(newDiscount);

    const newSubcategory = createSubcategory();
    subcategory = await repoSubcategory.save(newSubcategory);

    const newProduct = generateNewProducts(
      1,
      brand.id,
      category.id,
      subcategory.id,
    )[0];
    product = await repoProduct.save(newProduct);

    const newProductDiscounts = generateManyProductDiscountE2E(
      1,
      product,
      discount,
      adminUser,
    );
    await repo.save(newProductDiscounts);
  });

  describe('DELETE Product Discount', () => {
    it('/ should return 401 with invalid api key', async () => {
      const productId = 1;
      const discountId = 1;
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${productId}/${discountId}`)
        .set('x-api-key', 'invalid-api-key')
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should return 401 without api key', async () => {
      const productId = 1;
      const discountId = 1;
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${productId}/${discountId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should delete a product, return 200 with admin user', async () => {
      const productId = 1;
      const discountId = 1;

      const existing = await repo.findOne({
        where: { productId, discountId },
      });
      expect(existing).toBeDefined();

      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${productId}/${discountId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const { statusCode, message } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(message).toEqual(
        `The Product Discount with Product ID: ${productId} and Discount ID: ${discountId} deleted successfully`,
      );

      const deleted = await repo.findOne({
        where: { productId, discountId },
      });

      expect(deleted).toBeNull();
    });

    it('/ should return 401 with seller user', async () => {
      const productId = 1;
      const discountId = 1;

      const existing = await repo.findOne({
        where: { productId, discountId },
      });
      expect(existing).toBeDefined();

      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${productId}/${discountId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);

      const { statusCode, data, message, error } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toEqual(ERRORS.UNAUTHORIZED);

      const after = await repo.findOne({
        where: { productId, discountId },
      });

      expect(after).toBeDefined();
    });

    it('/ should return 401 with customer user', async () => {
      const productId = 1;
      const discountId = 1;

      const existing = await repo.findOne({
        where: { productId, discountId },
      });
      expect(existing).toBeDefined();

      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${productId}/${discountId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);

      const { statusCode, data, message, error } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toEqual(ERRORS.UNAUTHORIZED);

      const after = await repo.findOne({
        where: { productId, discountId },
      });

      expect(after).toBeDefined();
    });

    it('/ should return 401 without user', async () => {
      const productId = 1;
      const discountId = 1;

      const existing = await repo.findOne({
        where: { productId, discountId },
      });
      expect(existing).toBeDefined();

      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${productId}/${discountId}`)
        .set('x-api-key', API_KEY);

      const { statusCode, data, message } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.UNAUTHORIZED);

      const after = await repo.findOne({
        where: { productId, discountId },
      });

      expect(after).toBeDefined();
    });

    it('/ should return 404 when product discount does not exist', async () => {
      const productId = 9999;
      const discountId = 9999;

      const existing = await repo.findOne({
        where: { productId, discountId },
      });

      expect(existing).toBeNull();

      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${productId}/${discountId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const { statusCode, data, message, error } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data).toBeUndefined();
      expect(message).toEqual(
        `The Product Discount with Product ID: ${productId} and Discount ID: ${discountId} Not Found`,
      );
      expect(error).toEqual(ERRORS.NOT_FOUND);

      const after = await repo.findOne({
        where: { productId, discountId },
      });

      expect(after).toBeNull();
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
