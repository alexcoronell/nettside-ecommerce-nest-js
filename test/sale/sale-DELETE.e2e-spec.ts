/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reflector, APP_INTERCEPTOR } from '@nestjs/core';

/* Modules */
import { AppModule } from '../../src/app.module';
import { SaleModule } from '@sale/sale.module';
import { PaymentMethodModule } from '@payment_method/payment-method.module';
import { UserModule } from '@user/user.module';

/* Entities */
import { PaymentMethod } from '@payment_method/entities/payment-method.entity';

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
import { createSale } from '@faker/sale.faker';
import { generateNewPaymentMethods } from '@faker/paymentMethod.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/sale';
const ID = 1;

describe('SaleController (e2e) [DELETE]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoPaymentMethod: any = undefined;
  let repoUser: any = undefined;
  let adminCookies: string[];
  let sellerCookies: string[];
  let customerCookies: string[];
  let paymentMethod: PaymentMethod;

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
        SaleModule,
        PaymentMethodModule,
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
    app.use(cookieParser());
    await app.init();
    repo = app.get('SaleRepository');
    repoPaymentMethod = app.get('PaymentMethodRepository');
    repoUser = app.get('UserRepository');
  });

  beforeEach(async () => {
    await cleanDB();

    /* Login Users */
    const resLoginAdmin = await loginAdmin(app, repoUser);
    adminCookies = resLoginAdmin.cookies;

    const resLoginSeller = await loginSeller(app, repoUser);
    sellerCookies = resLoginSeller.cookies;

    const resLoginCustomer = await loginCustomer(app, repoUser);
    customerCookies = resLoginCustomer.cookies;

    const newPaymentMethods = generateNewPaymentMethods(5);
    const paymentMethods = await repoPaymentMethod.save(newPaymentMethods);
    paymentMethod = paymentMethods[0];

    const sale = repo.create({
      ...createSale(),
      paymentMethod: { id: paymentMethod.id },
      user: { id: 1 },
    });
    await repo.save(sale);
  });

  describe('DELETE Sale', () => {
    it('/:id should cancel a sale with admin cookies', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      const cancelledInDB = await repo.findOne({ where: { id: ID } });
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.isCancelled).toBe(true);
      expect(cancelledInDB?.isCancelled).toBe(true);
    });

    it('/:id should return 401 with seller cookies', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, error, message } = res.body;
      const cancelledInDB = await repo.findOne({ where: { id: ID } });
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
      expect(cancelledInDB?.isCancelled).toBe(false);
    });

    it('/:id should return 401 with customer cookies', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, error, message } = res.body;
      const cancelledInDB = await repo.findOne({ where: { id: ID } });
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
      expect(cancelledInDB?.isCancelled).toBe(false);
    });

    it('/:id should return 401 without cookies', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY);
      const { statusCode, message } = res.body;
      const cancelledInDB = await repo.findOne({ where: { id: ID } });
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.UNAUTHORIZED);
      expect(cancelledInDB?.isCancelled).toBe(false);
    });

    it('/:id should return 401 with invalid api key', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${ID}`)
        .set('x-api-key', 'invalid-api-key')
        .set('Cookie', adminCookies);
      const { statusCode, message } = res.body;
      const cancelledInDB = await repo.findOne({ where: { id: ID } });
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
      expect(cancelledInDB?.isCancelled).toBe(false);
    });

    it('/:id should return 401 if api key is missing', async () => {
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${ID}`)
        .set('Cookie', adminCookies);
      const { statusCode, message } = res.body;
      const cancelledInDB = await repo.findOne({ where: { id: ID } });
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
      expect(cancelledInDB?.isCancelled).toBe(false);
    });

    it('/:id should return 404 for non-existent sale', async () => {
      const nonExistentId = 9999;
      const res = await request(app.getHttpServer())
        .delete(`${PATH}/${nonExistentId}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, message, error } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(message).toBe(`Sale with ID ${nonExistentId} not found`);
      expect(error).toBe(ERRORS.NOT_FOUND);
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDataSource();
  });
});
