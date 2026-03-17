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
import { CategoryModule } from '@category/category.module';
import { SubcategoryModule } from '@subcategory/subcategory.module';
import { UserModule } from '@user/user.module';

/* Entities */
import { Brand } from '@brand/entities/brand.entity';
import { Category } from '@category/entities/category.entity';
import { Product } from '@product/entities/product.entity';
import { ProductSupplier } from '@product_supplier/entities/product-supplier.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';
import { Supplier } from '@supplier/entities/supplier.entity';
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
import { createSupplier } from '@faker/supplier.faker';
import { generateNewProducts } from '@faker/product.faker';
import { generateManyProductSuppliersE2E } from '@faker/productSupplier.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/product-supplier';
const COUNT_ALL = `${PATH}/count-all`;
const COUNT = `${PATH}/count`;
const FIND_ALL_BY_PRODUCT = `${PATH}/product`;
const FIND_ALL_BY_SUPPLIER = `${PATH}/supplier`;

describe('ProductSupplierController (e2e) [GET]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoBrand: any = undefined;
  let repoCategory: any = undefined;
  let repoSupplier: any = undefined;
  let repoProduct: any = undefined;
  let repoSubcategory: any = undefined;
  let repoUser: any = undefined;
  let adminUser: User;
  let adminAccessToken: string;
  let sellerAccessToken: string;
  let customerAccessToken: string;
  let brand: Brand;
  let category: Category;
  let supplier: Supplier;
  let product: Product;
  let subcategory: Subcategory;
  let productSuppliers: ProductSupplier[] = [];

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
    repo = app.get('ProductSupplierRepository');
    repoBrand = app.get('BrandRepository');
    repoCategory = app.get('CategoryRepository');
    repoSupplier = app.get('SupplierRepository');
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

    const newSupplier = createSupplier();
    supplier = await repoSupplier.save(newSupplier);

    const newSubcategory = createSubcategory();
    subcategory = await repoSubcategory.save(newSubcategory);

    const newProduct = generateNewProducts(
      1,
      brand.id,
      category.id,
      subcategory.id,
    )[0];
    product = await repoProduct.save(newProduct);

    const newProductSuppliers = generateManyProductSuppliersE2E(
      1,
      product,
      supplier,
      adminUser,
    );
    productSuppliers = await repo.save(newProductSuppliers);
  });

  describe('GET Product Supplier - Count-All', () => {
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
      expect(total).toEqual(productSuppliers.length);
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

  describe('GET Product Supplier - Count', () => {
    it('/count should return 401 if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(COUNT);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/count should return 401 if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/count should return 200 with admin access token', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(total).toEqual(productSuppliers.length);
    });

    it('/count should return 401 with seller access token', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, message, error, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
      expect(total).toBeUndefined();
    });

    it('/count should return 401 with customer access token', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, message, error, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
      expect(total).toBeUndefined();
    });

    it('/count should return 401 without access token', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', API_KEY);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(total).toBeUndefined();
    });
  });

  describe('GET Product Supplier - Find', () => {
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

    it('/ should return all product Suppliers with admin user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(productSuppliers.length);
    });

    it('/ should return 401 with seller user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('/ should return 401 with customer user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('/ should return 401 without user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    });
  });

  describe('GET Product Supplier - Find By Product', () => {
    const productId = 1;
    it('/product/:productId should return 401 if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(
        `${FIND_ALL_BY_PRODUCT}/${productId}`,
      );
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/product/:productId should return 401 if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_PRODUCT}/${productId}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/product/:productId should return all product Suppliers with admin user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_PRODUCT}/${productId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(productSuppliers.length);
    });

    it('/product/:productId should return 401 with seller user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_PRODUCT}/${productId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('/product/:productId should return 401 with customer user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_PRODUCT}/${productId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('/product/:productId should return 401 without user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_PRODUCT}/${productId}`)
        .set('x-api-key', API_KEY);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    });
  });

  describe('GET Product Supplier - Find By Supplier', () => {
    const productId = 1;
    it('/product/:supplierId should return 401 if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(
        `${FIND_ALL_BY_SUPPLIER}/${productId}`,
      );
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/product/:supplierId should return 401 if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_SUPPLIER}/${productId}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/product/:supplierId should return all product Suppliers with admin user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_SUPPLIER}/${productId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(productSuppliers.length);
    });

    it('/product/:supplierId should return 401 with seller user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_SUPPLIER}/${productId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('/product/:supplierId should return 401 with customer user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_SUPPLIER}/${productId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('/product/:supplierId should return 401 without user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_PRODUCT}/${productId}`)
        .set('x-api-key', API_KEY);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    });
  });

  describe('GET Product Supplier - Find One', () => {
    const id = 1;
    it('/:id should return 401 if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(`${PATH}/${id}`);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/:id should return 401 if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(`${PATH}/${id}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/:id should return one product Suppliers with admin user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data.id).toEqual(id);
    });

    it('/:id should return 401 with seller user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('/:id should return 401 with customer user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('/:id should return 401 without user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${id}`)
        .set('x-api-key', API_KEY);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
