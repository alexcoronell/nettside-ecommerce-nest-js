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
import { CreateProductSupplierDto } from '@product_supplier/dto/create-product-supplier.dto';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/product-supplier';

describe('ProductSupplierController (e2e) [POST]', () => {
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

    const newProductSupplier = generateProductSupplierE2E(
      1,
      products[0],
      suppliers[0],
      adminUser,
    );
    productSupplier = await repo.save(newProductSupplier);
  });

  describe('POST Product Supplier', () => {
    it('/ should create a product supplier, return 401 with invalid api key', async () => {
      const productId = products[1].id;
      const supplierId = suppliers[1].id;
      const dto: CreateProductSupplierDto = {
        supplierProductCode: 'TEST-CODE-001',
        costPrice: 99.99,
        isPrimarySupplier: true,
        product: productId,
        supplier: supplierId,
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

    it('/ should create a product supplier, return 401 without api key', async () => {
      const productId = products[1].id;
      const supplierId = suppliers[1].id;
      const dto: CreateProductSupplierDto = {
        supplierProductCode: 'TEST-CODE-001',
        costPrice: 99.99,
        isPrimarySupplier: true,
        product: productId,
        supplier: supplierId,
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

    it('/ should create a product supplier, return 201 with admin user', async () => {
      const productId = products[1].id;
      const supplierId = suppliers[1].id;
      const dto: CreateProductSupplierDto = {
        supplierProductCode: 'TEST-CODE-001',
        costPrice: 99.99,
        isPrimarySupplier: true,
        product: productId,
        supplier: supplierId,
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
      expect(data.supplier.id).toEqual(supplierId);
      expect(data.supplierProductCode).toEqual('TEST-CODE-001');
      expect(data.costPrice).toEqual('99.99');
      expect(data.isPrimarySupplier).toEqual(true);
    });

    it('/ should create a product supplier, return 401 with seller user', async () => {
      const productId = products[1].id;
      const supplierId = suppliers[1].id;
      const dto: CreateProductSupplierDto = {
        supplierProductCode: 'TEST-CODE-001',
        costPrice: 99.99,
        isPrimarySupplier: true,
        product: productId,
        supplier: supplierId,
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

    it('/ should create a product supplier, return 401 with customer user', async () => {
      const productId = products[1].id;
      const supplierId = suppliers[1].id;
      const dto: CreateProductSupplierDto = {
        supplierProductCode: 'TEST-CODE-001',
        costPrice: 99.99,
        isPrimarySupplier: true,
        product: productId,
        supplier: supplierId,
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

    it('/ should create a product supplier, return 401 without user', async () => {
      const productId = products[1].id;
      const supplierId = suppliers[1].id;
      const dto: CreateProductSupplierDto = {
        supplierProductCode: 'TEST-CODE-001',
        costPrice: 99.99,
        isPrimarySupplier: true,
        product: productId,
        supplier: supplierId,
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

    it('/ should return conflict if product supplier already exists', async () => {
      const productId = productSupplier.product.id;
      const supplierId = productSupplier.supplier.id;
      const dto: CreateProductSupplierDto = {
        supplierProductCode: 'DUPLICATE-CODE',
        costPrice: 50.0,
        isPrimarySupplier: false,
        product: productId,
        supplier: supplierId,
      };

      try {
        await request(app.getHttpServer())
          .post(PATH)
          .set('x-api-key', API_KEY)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(`The Product Supplier is already in use`);
      }
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
