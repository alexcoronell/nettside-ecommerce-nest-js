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
import { ProductSupplier } from '@product_supplier/entities/product-supplier.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';
import { Supplier } from '@supplier/entities/supplier.entity';
import { User } from '@user/entities/user.entity';

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

import { ERROR_MESSAGES, ERRORS, HTTP_STATUS } from '../constants';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* Faker */
import { createBrand } from '@faker/brand.faker';
import { createCategory } from '@faker/category.faker';
import { createSubcategory } from '@faker/subcategory.faker';
import { generateNewProducts } from '@faker/product.faker';
import { generateNewSuppliers } from '@faker/supplier.faker';
import { generateProductSupplierE2E } from '@faker/productSupplier.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/product-supplier';

describe('ProductSupplierController (e2e) [DELETE]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoBrand: any = undefined;
  let repoCategory: any = undefined;
  let repoProduct: any = undefined;
  let repoSubcategory: any = undefined;
  let repoSupplier: any = undefined;
  let repoUser: any = undefined;
  let adminUser: User;
  let adminAccessToken: string;
  let sellerAccessToken: string;
  let customerAccessToken: string;
  let brand: Brand;
  let category: Category;
  let product: Product;
  let subcategory: Subcategory;
  let supplier: Supplier;
  let productSupplier: ProductSupplier;

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
    repoProduct = app.get('ProductRepository');
    repoSubcategory = app.get('SubcategoryRepository');
    repoSupplier = app.get('SupplierRepository');
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

    /* Create brand, category, subcategory, product and supplier for testing */
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

    const newSupplier = generateNewSuppliers(1)[0];
    supplier = await repoSupplier.save(newSupplier);

    const newProductSupplier = generateProductSupplierE2E(
      1,
      product,
      supplier,
      adminUser,
    );
    productSupplier = await repo.save(newProductSupplier);
  });

  describe('DELETE Product Supplier', () => {
    it('/ should return 401 with invalid api key', async () => {
      const id = productSupplier.id;
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${id}`)
        .set('x-api-key', 'invalid-api-key')
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should return 401 without api key', async () => {
      const id = productSupplier.id;
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should delete a product supplier, return 200 with admin user', async () => {
      const id = productSupplier.id;

      const existing = await repo.findOne({
        where: { id, isDeleted: false },
      });
      expect(existing).toBeDefined();

      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const { statusCode, message } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(message).toEqual(
        `The Product Supplier with id: ${id} has been deleted`,
      );

      // Verify soft delete - record should still exist but marked as deleted
      const deleted = await repo.findOne({
        where: { id },
      });
      expect(deleted).toBeDefined();
      expect(deleted.isDeleted).toBe(true);
      expect(deleted.deletedAt).toBeDefined();
      //expect(deleted.deletedBy.id).toBe(adminUser.id);

      // Verify it's not found when searching for non-deleted records
      const notFound = await repo.findOne({
        where: { id, isDeleted: false },
      });
      expect(notFound).toBeNull();
    });

    it('/ should return 401 with seller user', async () => {
      const id = productSupplier.id;

      const existing = await repo.findOne({
        where: { id, isDeleted: false },
      });
      expect(existing).toBeDefined();

      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);

      const { statusCode, data, message, error } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toEqual(ERRORS.UNAUTHORIZED);

      // Verify record is still not deleted
      const after = await repo.findOne({
        where: { id, isDeleted: false },
      });
      expect(after).toBeDefined();
      expect(after.isDeleted).toBe(false);
    });

    it('/ should return 401 with customer user', async () => {
      const id = productSupplier.id;

      const existing = await repo.findOne({
        where: { id, isDeleted: false },
      });
      expect(existing).toBeDefined();

      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);

      const { statusCode, data, message, error } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toEqual(ERRORS.UNAUTHORIZED);

      // Verify record is still not deleted
      const after = await repo.findOne({
        where: { id, isDeleted: false },
      });
      expect(after).toBeDefined();
      expect(after.isDeleted).toBe(false);
    });

    it('/ should return 401 without user', async () => {
      const id = productSupplier.id;

      const existing = await repo.findOne({
        where: { id, isDeleted: false },
      });
      expect(existing).toBeDefined();

      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${id}`)
        .set('x-api-key', API_KEY);

      const { statusCode, data, message } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.UNAUTHORIZED);

      // Verify record is still not deleted
      const after = await repo.findOne({
        where: { id, isDeleted: false },
      });
      expect(after).toBeDefined();
      expect(after.isDeleted).toBe(false);
    });

    it('/ should return 404 when product supplier does not exist', async () => {
      const id = 9999;

      const existing = await repo.findOne({
        where: { id, isDeleted: false },
      });
      expect(existing).toBeNull();

      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const { statusCode, message } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(message).toEqual(`The Product Supplier with id: ${id} not found`);
    });

    it('/ should return 404 when trying to delete already deleted product supplier', async () => {
      const id = productSupplier.id;

      // First delete the product supplier
      await request(app.getHttpServer())
        .delete(`${PATH}/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      // Try to delete again
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const { statusCode, message } = res.body;

      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(message).toEqual(`The Product Supplier with id: ${id} not found`);
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
