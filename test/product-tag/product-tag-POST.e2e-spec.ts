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
import { CreateProductTagDto } from '@product_tag/dto/create-product-tag.dto';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/product-tag';
const MANY_PATH = `${PATH}/many`;

describe('ProductTagController (e2e) [POST]', () => {
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
  let products: Product[];
  let subcategory: Subcategory;
  let tags: Tag[];
  let productTag: ProductTag;

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

    /* Create brand, category, subcategory, products and tags for testing */
    const newBrand = createBrand();
    brand = await repoBrand.save(newBrand);

    const newCategory = createCategory();
    category = await repoCategory.save(newCategory);

    const newSubcategory = createSubcategory();
    subcategory = await repoSubcategory.save(newSubcategory);

    const newProducts = generateNewProducts(
      5,
      brand.id,
      category.id,
      subcategory.id,
    );
    products = await repoProduct.save(newProducts);

    const newTags = [createTag(), createTag(), createTag()];
    tags = await repoTag.save(newTags);

    const newProductTag = {
      productId: products[0].id,
      tagId: tags[0].id,
      product: products[0],
      tag: tags[0],
      createdBy: adminUser,
      createdAt: new Date(),
    };
    productTag = await repo.save(newProductTag);
  });

  describe('POST Product Tag', () => {
    it('/ should create a product tag, return 401 with invalid api key', async () => {
      const dto: CreateProductTagDto = {
        product: products[1].id,
        tag: tags[1].id,
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

    it('/ should create a product tag, return 401 without api key', async () => {
      const dto: CreateProductTagDto = {
        product: products[1].id,
        tag: tags[1].id,
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

    it('/ should create a product tag, return 201 with admin user', async () => {
      const dto: CreateProductTagDto = {
        product: products[1].id,
        tag: tags[1].id,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.CREATED);
      expect(data).toBeDefined();
      expect(data.productId).toEqual(products[1].id);
      expect(data.tagId).toEqual(tags[1].id);
      expect(data.createdBy.id).toBeDefined();
    });

    it('/ should create a product tag, return 401 with seller user', async () => {
      const dto: CreateProductTagDto = {
        product: products[1].id,
        tag: tags[1].id,
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

    it('/ should create a product tag, return 401 with customer user', async () => {
      const dto: CreateProductTagDto = {
        product: products[1].id,
        tag: tags[1].id,
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

    it('/ should create a product tag, return 401 without user', async () => {
      const dto: CreateProductTagDto = {
        product: products[1].id,
        tag: tags[1].id,
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

    it('/ should return conflict if product tag already exists', async () => {
      const dto: CreateProductTagDto = {
        product: productTag.productId,
        tag: productTag.tagId,
      };

      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto);

      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(message).toBe(`The Product Tag is already in use`);
    });

    it('/ should return 400 with invalid product id', async () => {
      const dto: CreateProductTagDto = {
        product: 9999,
        tag: tags[1].id,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(message).toContain('Product');
    });

    it('/ should return 400 with invalid tag id', async () => {
      const dto: CreateProductTagDto = {
        product: products[1].id,
        tag: 9999,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(message).toContain('Tag');
    });
  });

  describe('POST Product Tag Many', () => {
    it('/many should create multiple product tags, return 401 with invalid api key', async () => {
      const dtos: CreateProductTagDto[] = [
        { product: products[1].id, tag: tags[1].id },
        { product: products[2].id, tag: tags[2].id },
      ];
      const res = await request(app.getHttpServer())
        .post(MANY_PATH)
        .set('x-api-key', 'invalid-api-key')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dtos);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/many should create multiple product tags, return 401 without api key', async () => {
      const dtos: CreateProductTagDto[] = [
        { product: products[1].id, tag: tags[1].id },
        { product: products[2].id, tag: tags[2].id },
      ];
      const res = await request(app.getHttpServer())
        .post(MANY_PATH)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dtos);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/many should create multiple product tags, return 201 with admin user', async () => {
      const dtos: CreateProductTagDto[] = [
        { product: products[1].id, tag: tags[1].id },
        { product: products[2].id, tag: tags[2].id },
      ];
      const res = await request(app.getHttpServer())
        .post(MANY_PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dtos);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.CREATED);
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0].productId).toEqual(products[1].id);
      expect(data[0].tagId).toEqual(tags[1].id);
      expect(data[1].productId).toEqual(products[2].id);
      expect(data[1].tagId).toEqual(tags[2].id);
    });

    it('/many should create single product tag when passed single object, return 201 with admin user', async () => {
      const dto: CreateProductTagDto = {
        product: products[1].id,
        tag: tags[1].id,
      };
      const res = await request(app.getHttpServer())
        .post(MANY_PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.CREATED);
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].productId).toEqual(products[1].id);
      expect(data[0].tagId).toEqual(tags[1].id);
    });

    it('/many should create multiple product tags, return 401 with seller user', async () => {
      const dtos: CreateProductTagDto[] = [
        { product: products[1].id, tag: tags[1].id },
        { product: products[2].id, tag: tags[2].id },
      ];
      const res = await request(app.getHttpServer())
        .post(MANY_PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`)
        .send(dtos);
      const { statusCode, data, message, error } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toEqual(ERRORS.UNAUTHORIZED);
    });

    it('/many should create multiple product tags, return 401 with customer user', async () => {
      const dtos: CreateProductTagDto[] = [
        { product: products[1].id, tag: tags[1].id },
        { product: products[2].id, tag: tags[2].id },
      ];
      const res = await request(app.getHttpServer())
        .post(MANY_PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(dtos);
      const { statusCode, data, message, error } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toEqual(ERRORS.UNAUTHORIZED);
    });

    it('/many should create multiple product tags, return 401 without user', async () => {
      const dtos: CreateProductTagDto[] = [
        { product: products[1].id, tag: tags[1].id },
        { product: products[2].id, tag: tags[2].id },
      ];
      const res = await request(app.getHttpServer())
        .post(MANY_PATH)
        .set('x-api-key', API_KEY)
        .send(dtos);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.UNAUTHORIZED);
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
