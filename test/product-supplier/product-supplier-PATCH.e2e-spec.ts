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
import { UpdateProductSupplierDto } from '@product_supplier/dto/update-product-supplier.dto';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

describe('ProductSupplierController (e2e) [PATCH]', () => {
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
  let products: Product[];
  let subcategory: Subcategory;
  let suppliers: Supplier[];
  let productSuppliers: ProductSupplier[];

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

    /* Create brand, category, subcategory, products and suppliers for testing */
    const newBrand = createBrand();
    brand = await repoBrand.save(newBrand);

    const newCategory = createCategory();
    category = await repoCategory.save(newCategory);

    const newSubcategory = createSubcategory();
    subcategory = await repoSubcategory.save(newSubcategory);

    const newProducts = generateNewProducts(
      10,
      brand.id,
      category.id,
      subcategory.id,
    );
    products = await repoProduct.save(newProducts);

    const newSuppliers = generateNewSuppliers(10);
    suppliers = await repoSupplier.save(newSuppliers);

    /* Create multiple product suppliers for testing */
    const newProductSuppliers = [
      generateProductSupplierE2E(1, products[0], suppliers[0], adminUser),
      generateProductSupplierE2E(2, products[1], suppliers[1], adminUser),
      generateProductSupplierE2E(3, products[2], suppliers[2], adminUser),
    ];
    productSuppliers = await repo.save(newProductSuppliers);
  });

  describe('PATCH product supplier', () => {
    it('/:id should update a product supplier with admin user', async () => {
      const id = productSuppliers[0].id;
      const updatedData: UpdateProductSupplierDto = {
        supplierProductCode: 'UPDATED-CODE-001',
        costPrice: 150.75,
        isPrimarySupplier: false,
      };
      const res = await request(app.getHttpServer())
        .patch(`/product-supplier/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.supplierProductCode).toBe(updatedData.supplierProductCode);
      expect(data.costPrice).toBe(150.75);
      expect(data.isPrimarySupplier).toBe(updatedData.isPrimarySupplier);
    });

    it('/:id should return 401 if the user is seller', async () => {
      const id = productSuppliers[0].id;
      const updatedData: UpdateProductSupplierDto = {
        supplierProductCode: 'UPDATED-CODE-001',
      };
      const res = await request(app.getHttpServer())
        .patch(`/product-supplier/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`)
        .send(updatedData);
      const { statusCode, data, message, error } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toEqual(ERRORS.UNAUTHORIZED);
    });

    it('/:id should return 401 if the user is customer', async () => {
      const id = productSuppliers[0].id;
      const updatedData: UpdateProductSupplierDto = {
        supplierProductCode: 'UPDATED-CODE-001',
      };
      const res = await request(app.getHttpServer())
        .patch(`/product-supplier/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(updatedData);
      const { statusCode, data, message, error } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toEqual(ERRORS.UNAUTHORIZED);
    });

    it('/:id should return 401 without user', async () => {
      const id = productSuppliers[0].id;
      const updatedData: UpdateProductSupplierDto = {
        supplierProductCode: 'UPDATED-CODE-001',
      };
      const res = await request(app.getHttpServer())
        .patch(`/product-supplier/${id}`)
        .set('x-api-key', API_KEY)
        .send(updatedData);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('should return 404 if product supplier does not exist', async () => {
      const id = 9999;
      const updatedData: UpdateProductSupplierDto = {
        supplierProductCode: 'UPDATED-CODE-001',
      };
      const res = await request(app.getHttpServer())
        .patch(`/product-supplier/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(message).toBe(`The Product Supplier with id: ${id} not found`);
    });

    it('/:id should return 401 if api key is missing', async () => {
      const id = productSuppliers[0].id;
      const updatedData: UpdateProductSupplierDto = {
        supplierProductCode: 'UPDATED-CODE-001',
      };
      const res = await request(app.getHttpServer())
        .patch(`/product-supplier/${id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/:id should return 401 if api key is invalid', async () => {
      const id = productSuppliers[0].id;
      const updatedData: UpdateProductSupplierDto = {
        supplierProductCode: 'UPDATED-CODE-001',
      };
      const res = await request(app.getHttpServer())
        .patch(`/product-supplier/${id}`)
        .set('x-api-key', 'invalid-api-key')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData);
      const { statusCode, data, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(message).toEqual(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/:id should update only specific fields when provided', async () => {
      const id = productSuppliers[0].id;
      const updatedData: UpdateProductSupplierDto = {
        costPrice: 299.99,
      };
      const res = await request(app.getHttpServer())
        .patch(`/product-supplier/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.costPrice).toBe(299.99);
      // Other fields should remain unchanged
      expect(data.supplierProductCode).toBe(
        productSuppliers[0].supplierProductCode,
      );
      expect(data.isPrimarySupplier).toBe(
        productSuppliers[0].isPrimarySupplier,
      );
    });

    it('/:id should update product and supplier references', async () => {
      const id = productSuppliers[0].id;
      const updatedData: UpdateProductSupplierDto = {
        product: products[3].id,
        supplier: suppliers[3].id,
      };
      const res = await request(app.getHttpServer())
        .patch(`/product-supplier/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.product.id).toBe(products[3].id);
      expect(data.supplier.id).toBe(suppliers[3].id);
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
