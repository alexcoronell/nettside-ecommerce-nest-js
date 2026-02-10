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
import { BrandModule } from '@brand/brand.module';
import { CategoryModule } from '@category/category.module';
import { SubcategoryModule } from '@subcategory/subcategory.module';
import { ProductModule } from '@product/product.module';
import { SaleModule } from '@sale/sale.module';
import { SaleDetailModule } from '@sale_detail/sale-detail.module';
import { UserModule } from '@user/user.module';

/* Entities */
import { Brand } from '@brand/entities/brand.entity';
import { Category } from '@category/entities/category.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';
import { Sale } from '@sale/entities/sale.entity';
import { SaleDetail } from '@sale_detail/entities/sale-detail.entity';

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
import { generateNewPaymentMethods } from '@faker/paymentMethod.faker';
import { generateManySaleDetails } from '@faker/saleDetail.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/sale-detail';
const COUNT = `${PATH}/count`;
const FIND_BY_SALE = `${PATH}/sale`;
const ID = 1;

describe('SaleDetailController (e2e) [GET]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoBrand: any = undefined;
  let repoCategory: any = undefined;
  let repoSubcategory: any = undefined;
  let repoProduct: any = undefined;
  let repoSale: any = undefined;
  let repoPaymentMethod: any = undefined;
  let repoUser: any = undefined;
  let adminAccessToken: string;
  let sellerAccessToken: string;
  let customerAccessToken: string;
  let brand: Brand;
  let category: Category;
  let subcategory: Subcategory;
  let sale: Sale;
  let saleDetails: SaleDetail[] = [];

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
        ProductModule,
        SaleModule,
        SaleDetailModule,
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
    repo = app.get('SaleDetailRepository');
    repoBrand = app.get('BrandRepository');
    repoCategory = app.get('CategoryRepository');
    repoSubcategory = app.get('SubcategoryRepository');
    repoProduct = app.get('ProductRepository');
    repoSale = app.get('SaleRepository');
    repoPaymentMethod = app.get('PaymentMethodRepository');
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

    const newProducts = generateNewProducts(
      5,
      category.id,
      subcategory.id,
      brand.id,
    );
    const savedProducts = await repoProduct.save(newProducts);

    const newPaymentMethods = generateNewPaymentMethods(5);
    const paymentMethods = await repoPaymentMethod.save(newPaymentMethods);
    const paymentMethod = paymentMethods[0];

    const saleDto = {
      totalAmount: 100,
      shippingAddress: 'Test Address 123',
      paymentMethod: paymentMethod.id,
    };
    sale = await repoSale.save(saleDto);

    const newSaleDetails = generateManySaleDetails(5);
    for (let i = 0; i < newSaleDetails.length; i++) {
      newSaleDetails[i].product = savedProducts[i];
      newSaleDetails[i].sale = sale;
    }
    saleDetails = await repo.save(newSaleDetails);
  });

  describe('GET SaleDetail - Count', () => {
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
      expect(total).toEqual(saleDetails.length);
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

  describe('GET SaleDetail - Find All', () => {
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

    it('/ should return all sale details with admin user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(saleDetails.length);
      expect(total).toEqual(saleDetails.length);
    });

    it('/ should return 401 with seller user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, message, error, data, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(total).toBeUndefined();
    });

    it('/ should return 401 with customer user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, message, error, data, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(total).toBeUndefined();
    });

    it('/ should return 401 without access token', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY);
      const { statusCode, data, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(total).toBeUndefined();
    });
  });

  describe('GET SaleDetail - Find By Id', () => {
    it('/:id should return 401 if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(`${PATH}/${ID}`);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/:id should return 401 if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/:id should return a sale detail by id with admin user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.id).toBeDefined();
      expect(data.quantity).toBeDefined();
    });

    it('/:id should return 401 with seller user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, message, error, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
      expect(data).toBeUndefined();
    });

    it('/:id should return 401 with customer user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, message, error, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
      expect(data).toBeUndefined();
    });

    it('/:id should return 401 without access token', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
    });

    it('/:id should return 404 when sale detail does not exist', async () => {
      const nonExistentId = 9999;
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${nonExistentId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data, message, error } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data).toBeUndefined();
      expect(error).toBe(ERRORS.NOT_FOUND);
      expect(message).toBe(
        `The Sale Detail with ID ${nonExistentId} not found`,
      );
    });
  });

  describe('GET SaleDetail - Find By Sale', () => {
    it('/sale/:id should return 401 if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(
        `${FIND_BY_SALE}/${ID}`,
      );
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/sale/:id should return 401 if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(`${FIND_BY_SALE}/${ID}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/sale/:id should return sale details by sale with admin user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_SALE}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toBeGreaterThan(0);
    });

    it('/sale/:id should return 401 with seller user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_SALE}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, message, error, data, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(total).toBeUndefined();
    });

    it('/sale/:id should return 401 with customer user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_SALE}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, message, error, data, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(total).toBeUndefined();
    });

    it('/sale/:id should return 401 without access token', async () => {
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_SALE}/${ID}`)
        .set('x-api-key', API_KEY);
      const { statusCode, data, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(data).toBeUndefined();
      expect(total).toBeUndefined();
    });

    it('/sale/:id should return empty array for non-existing sale', async () => {
      const nonExistentSaleId = 9999;
      const res = await request(app.getHttpServer())
        .get(`${FIND_BY_SALE}/${nonExistentSaleId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toEqual([]);
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDataSource();
  });
});
