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
import { ProductTag } from '@product_tag/entities/product-tag.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';
import { Tag } from '@tag/entities/tag.entity';
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
import { generateNewProducts } from '@faker/product.faker';
import { createTag } from '@faker/tag.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/product-tag';
const COUNT = `${PATH}/count`;
const FIND_ALL_BY_PRODUCT = `${PATH}/product`;
const FIND_ALL_BY_TAG = `${PATH}/tag`;
const FIND_ONE = `${PATH}/one`;

describe('ProductTagController (e2e) [GET]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoBrand: any = undefined;
  let repoCategory: any = undefined;
  let repoProduct: any = undefined;
  let repoSubcategory: any = undefined;
  let repoTag: any = undefined;
  let repoUser: any = undefined;
  let adminUser: User;
  let adminAccessToken: string;
  let sellerAccessToken: string;
  let customerAccessToken: string;
  let brand: Brand;
  let category: Category;
  let product: Product;
  let subcategory: Subcategory;
  let tag: Tag;
  let productTags: ProductTag[] = [];

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
    repo = app.get('ProductTagRepository');
    repoBrand = app.get('BrandRepository');
    repoCategory = app.get('CategoryRepository');
    repoProduct = app.get('ProductRepository');
    repoSubcategory = app.get('SubcategoryRepository');
    repoTag = app.get('TagRepository');
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

    /* Create brand, category, subcategory, product and tag for testing */
    const newBrand = createBrand();
    brand = await repoBrand.save(newBrand);

    const newCategory = createCategory();
    category = await repoCategory.save(newCategory);

    const newSubcategory = createSubcategory();
    subcategory = await repoSubcategory.save(newSubcategory);

    const newProduct = generateNewProducts(
      1,
      brand.id,
      category.id,
      subcategory.id,
    )[0];
    product = await repoProduct.save(newProduct);

    const newTag = createTag();
    tag = await repoTag.save(newTag);

    const newProductTag = {
      productId: product.id,
      tagId: tag.id,
      product,
      tag,
      createdBy: adminUser,
      createdAt: new Date(),
    };
    productTags = await repo.save([newProductTag]);
  });

  describe('GET Product Tag - Count', () => {
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
      expect(total).toEqual(productTags.length);
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

  describe('GET Product Tag - Find All', () => {
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

    it('/ should return all product tags with admin user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(productTags.length);
    });

    it('/ should return all product tags with seller user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(productTags.length);
    });

    it('/ should return 401 with customer user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.CUSTOMER_DENIED);
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

  describe('GET Product Tag - Find By Product', () => {
    it('/product/:productId should return 200 without authentication (public endpoint)', async () => {
      const productId = product.id;
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_PRODUCT}/${productId}`)
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(productTags.length);
    });

    it('/product/:productId should return 401 if api key is missing', async () => {
      const productId = product.id;
      const res: any = await request(app.getHttpServer()).get(
        `${FIND_ALL_BY_PRODUCT}/${productId}`,
      );
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/product/:productId should return 401 if api key is invalid', async () => {
      const productId = product.id;
      const res: any = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_PRODUCT}/${productId}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/product/:productId should return all product tags by product with admin user', async () => {
      const productId = product.id;
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_PRODUCT}/${productId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(productTags.length);
    });

    it('/product/:productId should return all product tags by product with seller user', async () => {
      const productId = product.id;
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_PRODUCT}/${productId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(productTags.length);
    });

    it('/product/:productId should return all product tags by product with customer user', async () => {
      const productId = product.id;
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_PRODUCT}/${productId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(productTags.length);
    });
  });

  describe('GET Product Tag - Find By Tag', () => {
    it('/tag/:tagId should return 200 without authentication (public endpoint)', async () => {
      const tagId = tag.id;
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_TAG}/${tagId}`)
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(productTags.length);
    });

    it('/tag/:tagId should return 401 if api key is missing', async () => {
      const tagId = tag.id;
      const res: any = await request(app.getHttpServer()).get(
        `${FIND_ALL_BY_TAG}/${tagId}`,
      );
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/tag/:tagId should return 401 if api key is invalid', async () => {
      const tagId = tag.id;
      const res: any = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_TAG}/${tagId}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/tag/:tagId should return all product tags by tag with admin user', async () => {
      const tagId = tag.id;
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_TAG}/${tagId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(productTags.length);
    });

    it('/tag/:tagId should return all product tags by tag with seller user', async () => {
      const tagId = tag.id;
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_TAG}/${tagId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(productTags.length);
    });

    it('/tag/:tagId should return all product tags by tag with customer user', async () => {
      const tagId = tag.id;
      const res = await request(app.getHttpServer())
        .get(`${FIND_ALL_BY_TAG}/${tagId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(productTags.length);
    });
  });

  describe('GET Product Tag - Find One', () => {
    it('/one should return 401 if api key is missing', async () => {
      const criteria = { productId: product.id, tagId: tag.id };
      const res: any = await request(app.getHttpServer())
        .get(FIND_ONE)
        .send(criteria);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/one should return 401 if api key is invalid', async () => {
      const criteria = { productId: product.id, tagId: tag.id };
      const res: any = await request(app.getHttpServer())
        .get(FIND_ONE)
        .set('x-api-key', 'invalid-api-key')
        .send(criteria);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/one should return one product tag with admin user', async () => {
      const criteria = { productId: product.id, tagId: tag.id };
      const res = await request(app.getHttpServer())
        .get(FIND_ONE)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(criteria);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data.productId).toEqual(product.id);
      expect(data.tagId).toEqual(tag.id);
    });

    it('/one should return 401 with seller user', async () => {
      const criteria = { productId: product.id, tagId: tag.id };
      const res = await request(app.getHttpServer())
        .get(FIND_ONE)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`)
        .send(criteria);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('/one should return 401 with customer user', async () => {
      const criteria = { productId: product.id, tagId: tag.id };
      const res = await request(app.getHttpServer())
        .get(FIND_ONE)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(criteria);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('/one should return 401 without user', async () => {
      const criteria = { productId: product.id, tagId: tag.id };
      const res = await request(app.getHttpServer())
        .get(FIND_ONE)
        .set('x-api-key', API_KEY)
        .send(criteria);
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
