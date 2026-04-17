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
import { SupplierModule } from '@supplier/supplier.module';
import { UserModule } from '@user/user.module';

/* Entities */
import { Supplier } from '@supplier/entities/supplier.entity';
import { Purchase } from '@purchase/entities/purchase.entity';

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
import { createSupplier } from '@faker/supplier.faker';
import { generateManyPurchases } from '@faker/purchase.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/purchase';
const COUNT = `${PATH}/count`;
const ID = 1;

describe('PurchaseController (e2e) [GET]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoSupplier: any = undefined;
  let repoUser: any = undefined;
  let adminAccessToken: string;
  let sellerAccessToken: string;
  let customerAccessToken: string;
  let supplier: Supplier;
  let purchases: Purchase[] = [];

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
    repo = app.get('PurchaseRepository');
    repoSupplier = app.get('SupplierRepository');
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

    const newSupplier = createSupplier();
    supplier = await repoSupplier.save(newSupplier);

    const newPurchases = generateManyPurchases(5);
    for (const purchase of newPurchases) {
      purchase.supplier = supplier;
    }
    purchases = await repo.save(newPurchases);
  });

  describe('GET Purchase - Count', () => {
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

    it('/count should return 200 and total with admin access token', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(total).toEqual(purchases.length);
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

  describe('GET Purchase - Find All', () => {
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

    it('/ should return all purchases with admin user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data, meta } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.length).toEqual(purchases.length);
      expect(meta.total).toEqual(purchases.length);
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

  describe('GET Purchase - Find By Id', () => {
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

    it('/:id should return a purchase by id with admin user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.id).toBeDefined();
      expect(data.totalAmount).toBeDefined();
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

    it('/:id should return 404 when purchase does not exist', async () => {
      const nonExistentId = 9999;
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${nonExistentId}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data, message, error } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(data).toBeUndefined();
      expect(error).toBe(ERRORS.NOT_FOUND);
      expect(message).toBe(`The Purchase with ID ${nonExistentId} not found`);
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDataSource();
  });
});
