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

describe('ProductTagController (e2e) [DELETE]', () => {
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
    await repo.save(newProductTag);
  });

  describe('DELETE Product Tag', () => {
    it('/ should return 401 with invalid api key', async () => {
      const criteria = { productId: product.id, tagId: tag.id };
      const res = await request(app.getHttpServer())
        .delete(PATH)
        .set('x-api-key', 'invalid-api-key')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(criteria);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should return 401 without api key', async () => {
      const criteria = { productId: product.id, tagId: tag.id };
      const res = await request(app.getHttpServer())
        .delete(PATH)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(criteria);

      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should delete a product tag, return 200 with admin user', async () => {
      const criteria = { productId: product.id, tagId: tag.id };

      const existing = await repo.findOne({
        where: { productId: product.id, tagId: tag.id },
      });
      expect(existing).toBeDefined();

      const res = await request(app.getHttpServer())
        .delete(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(criteria);

      const { statusCode, message } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(message).toEqual(`The Product Tag has been deleted`);

      // Verify hard delete - record should not exist anymore
      const deleted = await repo.findOne({
        where: { productId: product.id, tagId: tag.id },
      });
      expect(deleted).toBeNull();
    });

    it('/ should return 401 with seller user', async () => {
      const criteria = { productId: product.id, tagId: tag.id };

      const existing = await repo.findOne({
        where: { productId: product.id, tagId: tag.id },
      });
      expect(existing).toBeDefined();

      const res = await request(app.getHttpServer())
        .delete(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`)
        .send(criteria);

      const { statusCode, data, message, error } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toEqual(ERRORS.UNAUTHORIZED);

      // Verify record is still not deleted
      const after = await repo.findOne({
        where: { productId: product.id, tagId: tag.id },
      });
      expect(after).toBeDefined();
    });

    it('/ should return 401 with customer user', async () => {
      const criteria = { productId: product.id, tagId: tag.id };

      const existing = await repo.findOne({
        where: { productId: product.id, tagId: tag.id },
      });
      expect(existing).toBeDefined();

      const res = await request(app.getHttpServer())
        .delete(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(criteria);

      const { statusCode, data, message, error } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toEqual(ERRORS.UNAUTHORIZED);

      // Verify record is still not deleted
      const after = await repo.findOne({
        where: { productId: product.id, tagId: tag.id },
      });
      expect(after).toBeDefined();
    });

    it('/ should return 401 without user', async () => {
      const criteria = { productId: product.id, tagId: tag.id };

      const existing = await repo.findOne({
        where: { productId: product.id, tagId: tag.id },
      });
      expect(existing).toBeDefined();

      const res = await request(app.getHttpServer())
        .delete(PATH)
        .set('x-api-key', API_KEY)
        .send(criteria);

      const { statusCode, data, message } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.UNAUTHORIZED);

      // Verify record is still not deleted
      const after = await repo.findOne({
        where: { productId: product.id, tagId: tag.id },
      });
      expect(after).toBeDefined();
    });

    it('/ should return 404 when product tag does not exist', async () => {
      const criteria = { productId: 9999, tagId: 9999 };

      const existing = await repo.findOne({
        where: { productId: 9999, tagId: 9999 },
      });
      expect(existing).toBeNull();

      const res = await request(app.getHttpServer())
        .delete(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(criteria);

      const { statusCode, message } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(message).toEqual(`The Product Tag not found`);
    });

    it('/ should return 404 when trying to delete already deleted product tag', async () => {
      const criteria = { productId: product.id, tagId: tag.id };

      // First delete the product tag
      await request(app.getHttpServer())
        .delete(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(criteria);

      // Try to delete again
      const res = await request(app.getHttpServer())
        .delete(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(criteria);

      const { statusCode, message } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(message).toEqual(`The Product Tag not found`);
    });

    it('/ should return 400 when criteria is missing', async () => {
      const res = await request(app.getHttpServer())
        .delete(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({});

      const { statusCode, message } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(message).toBe(ERROR_MESSAGES.BAD_REQUEST_CRITERIA);
    });

    it('/ should return 400 when productId is missing', async () => {
      const criteria = { tagId: tag.id };

      const res = await request(app.getHttpServer())
        .delete(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(criteria);

      const { statusCode, message } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(message).toBe(ERROR_MESSAGES.BAD_REQUEST_CRITERIA);
    });

    it('/ should return 400 when tagId is missing', async () => {
      const criteria = { productId: product.id };

      const res = await request(app.getHttpServer())
        .delete(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(criteria);

      const { statusCode, message } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(message).toBe(ERROR_MESSAGES.BAD_REQUEST_CRITERIA);
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
