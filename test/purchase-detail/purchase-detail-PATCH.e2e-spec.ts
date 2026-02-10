/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reflector, APP_INTERCEPTOR } from '@nestjs/core';

/* Modules */
import { AppModule } from '../../src/app.module';
import { BrandModule } from '@brand/brand.module';
import { CategoryModule } from '@category/category.module';
import { SubcategoryModule } from '@subcategory/subcategory.module';
import { SupplierModule } from '@supplier/supplier.module';
import { UserModule } from '@user/user.module';

/* Entities */
import { Brand } from '@brand/entities/brand.entity';
import { Category } from '@category/entities/category.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';
import { Supplier } from '@supplier/entities/supplier.entity';
import { Product } from '@product/entities/product.entity';
import { Purchase } from '@purchase/entities/purchase.entity';
import { PurchaseDetail } from '@purchase_detail/entities/purchase-detail.entity';

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
import { generatePurchase } from '@faker/purchase.faker';
import { generateManyPurchaseDetails } from '@faker/purchaseDetail.faker';
import { UpdatePurchaseDetailDto } from '@purchase_detail/dto/update-purchase-detail.dto';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/purchase-detail';
const ID = 1;

describe('PurchaseDetailController (e2e) [PATCH]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoBrand: any = undefined;
  let repoCategory: any = undefined;
  let repoSubcategory: any = undefined;
  let repoSupplier: any = undefined;
  let repoProduct: any = undefined;
  let repoPurchase: any = undefined;
  let repoUser: any = undefined;
  let adminAccessToken: string;
  let sellerAccessToken: string;
  let customerAccessToken: string;
  let brand: Brand;
  let category: Category;
  let subcategory: Subcategory;
  let supplier: Supplier;

  let purchase: Purchase;
  let purchaseDetails: PurchaseDetail[] = [];

  beforeAll(async () => {
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
        BrandModule,
        CategoryModule,
        SubcategoryModule,
        SupplierModule,
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
    repo = app.get('PurchaseDetailRepository');
    repoBrand = app.get('BrandRepository');
    repoCategory = app.get('CategoryRepository');
    repoSubcategory = app.get('SubcategoryRepository');
    repoSupplier = app.get('SupplierRepository');
    repoProduct = app.get('ProductRepository');
    repoPurchase = app.get('PurchaseRepository');
    repoUser = app.get('UserRepository');
  });

  beforeEach(async () => {
    await cleanDB();

    const resLoginAdmin = await loginAdmin(app, repoUser);
    adminAccessToken = resLoginAdmin.access_token;
    const resLoginSeller = await loginSeller(app, repoUser);
    sellerAccessToken = resLoginSeller.access_token;
    const resLoginCustomer = await loginCustomer(app, repoUser);
    customerAccessToken = resLoginCustomer.access_token;

    const newBrand = createBrand();
    brand = await repoBrand.save(newBrand);

    const newCategory = createCategory();
    category = await repoCategory.save(newCategory);

    const newSubcategories = createSubcategory(category.id);
    subcategory = await repoSubcategory.save(newSubcategories);

    const newSupplier = createSupplier();
    supplier = await repoSupplier.save(newSupplier);

    const newProducts = generateNewProducts(
      5,
      category.id,
      subcategory.id,
      brand.id,
    );
    const savedProducts = await repoProduct.save(newProducts);

    const newPurchase = generatePurchase(1);
    purchase = await repoPurchase.save(newPurchase);

    const newPurchaseDetails = generateManyPurchaseDetails(5);
    for (let i = 0; i < newPurchaseDetails.length; i++) {
      newPurchaseDetails[i].product = savedProducts[i];
      newPurchaseDetails[i].purchase = purchase;
    }
    purchaseDetails = await repo.save(newPurchaseDetails);
  });

  describe('PATCH PurchaseDetail', () => {
    it('/:id should update a purchase detail with admin user', async () => {
      const updatedData: UpdatePurchaseDetailDto = {
        quantity: 50,
      };
      const res = await request(app.getHttpServer())
        .patch(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.quantity).toBe(updatedData.quantity);
    });

    it('/:id should return 401 with seller user', async () => {
      const updatedData: UpdatePurchaseDetailDto = {
        quantity: 50,
      };
      const res = await request(app.getHttpServer())
        .patch(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`)
        .send(updatedData);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('/:id should return 401 with customer user', async () => {
      const updatedData: UpdatePurchaseDetailDto = {
        quantity: 50,
      };
      const res = await request(app.getHttpServer())
        .patch(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(updatedData);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('/:id should return 401 without user', async () => {
      const updatedData: UpdatePurchaseDetailDto = {
        quantity: 50,
      };
      const res = await request(app.getHttpServer())
        .patch(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .send(updatedData);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('/:id should return 401 with invalid api key', async () => {
      const updatedData: UpdatePurchaseDetailDto = {
        quantity: 50,
      };
      const res = await request(app.getHttpServer())
        .patch(`${PATH}/${ID}`)
        .set('x-api-key', 'invalid-api-key')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/:id should return 401 if api key is missing', async () => {
      const updatedData: UpdatePurchaseDetailDto = {
        quantity: 50,
      };
      const res = await request(app.getHttpServer())
        .patch(`${PATH}/${ID}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/:id should return 404 when purchase detail does not exist', async () => {
      const nonExistentId = 9999;
      const updatedData: UpdatePurchaseDetailDto = {
        quantity: 50,
      };
      const res = await request(app.getHttpServer())
        .patch(`${PATH}/${nonExistentId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData);
      const { statusCode, message, error } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(message).toBe(
        `The Purchase Detail with ID ${nonExistentId} not found`,
      );
      expect(error).toBe(ERRORS.NOT_FOUND);
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDataSource();
  });
});
