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
import { Discount } from '@discount/entities/discount.entity';
import { Product } from '@product/entities/product.entity';
import { ProductDiscount } from '@product_discount/entities/product-discount.entity';
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
import { generateNewDiscounts } from '@faker/discount.faker';
import { generateNewProducts } from '@faker/product.faker';
import { generateProductDiscountE2E } from '@faker/productDiscount.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';
import { CreateProductDiscountDto } from '@product_discount/dto/create-product-discount.dto';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/product-discount';
const MANY = `${PATH}/many`;

describe('ProductDiscountController (e2e) [POST]', () => {
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
  let discounts: Discount[];
  let products: Product[];
  let subcategory: Subcategory;
  let productDiscount: ProductDiscount;

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

    const newDiscounts = generateNewDiscounts(10);
    discounts = await repoDiscount.save(newDiscounts);

    const newSubcategory = createSubcategory();
    subcategory = await repoSubcategory.save(newSubcategory);

    const newProducts = generateNewProducts(
      10,
      brand.id,
      category.id,
      subcategory.id,
    );
    products = await repoProduct.save(newProducts);

    const newProductDiscount = generateProductDiscountE2E(
      products[0],
      discounts[0],
      adminUser,
    );
    productDiscount = await repo.save(newProductDiscount);
  });

  describe('POST Product Discount', () => {
    it('/ should create a product, return 401 with invalid api key', async () => {
      const productId = products[1].id;
      const discountId = discounts[1].id;
      const dto: CreateProductDiscountDto = {
        product: productId,
        discount: discountId,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', 'invalid-api-key')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should create a product, return 401 without api key', async () => {
      const productId = products[1].id;
      const discountId = discounts[1].id;
      const dto: CreateProductDiscountDto = {
        product: productId,
        discount: discountId,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should create a product, return 201 with admin user', async () => {
      const productId = products[1].id;
      const discountId = discounts[1].id;
      const dto: CreateProductDiscountDto = {
        product: productId,
        discount: discountId,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.CREATED);
      expect(data).toBeDefined();
      expect(data.product.id).toEqual(productId);
      expect(data.discount.id).toEqual(discountId);
    });

    it('/ should create a product, return 401 with seller user', async () => {
      const productId = products[1].id;
      const discountId = discounts[1].id;
      const dto: CreateProductDiscountDto = {
        product: productId,
        discount: discountId,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`)
        .send(dto);
      const { statusCode, data, message, error } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toEqual(ERRORS.UNAUTHORIZED);
    });

    it('/ should create a product, return 401 with customer user', async () => {
      const productId = products[1].id;
      const discountId = discounts[1].id;
      const dto: CreateProductDiscountDto = {
        product: productId,
        discount: discountId,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(dto);
      const { statusCode, data, message, error } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toEqual(ERRORS.UNAUTHORIZED);
    });

    it('/ should create a product, return 401 without user', async () => {
      const productId = products[1].id;
      const discountId = discounts[1].id;
      const dto: CreateProductDiscountDto = {
        product: productId,
        discount: discountId,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .send(dto);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('/ should return conflict if product discount already exists', async () => {
      const productId = productDiscount.productId;
      const discountId = productDiscount.discountId;
      const dto: CreateProductDiscountDto = {
        product: productId,
        discount: discountId,
      };

      try {
        await request(app.getHttpServer()).post(PATH).send(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(`The Product Discount is already in use`);
      }
    });
  });

  describe('POST Many Product Discount', () => {
    it('/ should create a product, return 401 with invalid api key', async () => {
      const productId = products[1].id;
      const discountId = discounts[1].id;
      const dto: CreateProductDiscountDto = {
        product: productId,
        discount: discountId,
      };
      const res = await request(app.getHttpServer())
        .post(MANY)
        .set('x-api-key', 'invalid-api-key')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should create a product, return 401 without api key', async () => {
      const productId = products[1].id;
      const discountId = discounts[1].id;
      const dto: CreateProductDiscountDto = {
        product: productId,
        discount: discountId,
      };
      const res = await request(app.getHttpServer())
        .post(MANY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should create a product, return 201 with admin user', async () => {
      const dtos: CreateProductDiscountDto[] = [
        {
          product: products[3].id,
          discount: discounts[3].id,
        },
        {
          product: products[4].id,
          discount: discounts[4].id,
        },
        {
          product: products[5].id,
          discount: discounts[5].id,
        },
      ];
      const res = await request(app.getHttpServer())
        .post(MANY)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dtos);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.CREATED);
      expect(data).toBeDefined();
      expect(data.length).toEqual(dtos.length);
    });

    it('/ should create a product, return 401 with seller user', async () => {
      const productId = products[1].id;
      const discountId = discounts[1].id;
      const dto: CreateProductDiscountDto = {
        product: productId,
        discount: discountId,
      };
      const res = await request(app.getHttpServer())
        .post(MANY)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`)
        .send(dto);
      const { statusCode, data, message, error } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toEqual(ERRORS.UNAUTHORIZED);
    });

    it('/ should create a product, return 401 with customer user', async () => {
      const productId = products[1].id;
      const discountId = discounts[1].id;
      const dto: CreateProductDiscountDto = {
        product: productId,
        discount: discountId,
      };
      const res = await request(app.getHttpServer())
        .post(MANY)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(dto);
      const { statusCode, data, message, error } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toEqual(ERRORS.UNAUTHORIZED);
    });

    it('/ should create a product, return 401 without user', async () => {
      const productId = products[1].id;
      const discountId = discounts[1].id;
      const dto: CreateProductDiscountDto = {
        product: productId,
        discount: discountId,
      };
      const res = await request(app.getHttpServer())
        .post(MANY)
        .set('x-api-key', API_KEY)
        .send(dto);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('/ should return conflict if product discount already exists', async () => {
      const productId = productDiscount.productId;
      const discountId = productDiscount.discountId;
      const dtos: CreateProductDiscountDto[] = [
        {
          product: productId,
          discount: discountId,
        },
      ];

      try {
        await request(app.getHttpServer()).post(MANY).send(dtos);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(`The Product Discount is already in use`);
      }
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
