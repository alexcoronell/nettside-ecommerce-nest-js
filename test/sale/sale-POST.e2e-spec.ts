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

import { ERROR_MESSAGES, HTTP_STATUS } from '../../src/commons/constants';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* Faker */
import { generateNewPaymentMethods } from '@faker/paymentMethod.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';
import { CreateSaleDto } from '@sale/dto/create-sale.dto';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/sale';

describe('SaleController (e2e) [POST]', () => {
  let app: INestApplication<App>;
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

    /* Create payment method for testing */
    const newPaymentMethods = generateNewPaymentMethods(5);
    const paymentMethods = await repoPaymentMethod.save(newPaymentMethods);
    paymentMethod = paymentMethods[0];
  });

  describe('POST Sale', () => {
    it('/ should create a sale, return 201 with customer cookies', async () => {
      const dto: CreateSaleDto = {
        totalAmount: 1500,
        shippingAddress: 'Calle Falsa 123',
        paymentMethod: paymentMethod.id,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies)
        .send(dto);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.CREATED);
      expect(data.totalAmount).toEqual(dto.totalAmount);
      expect(data.shippingAddress).toEqual(dto.shippingAddress);
    });

    it('/ should create a sale, return 201 with admin cookies', async () => {
      const dto: CreateSaleDto = {
        totalAmount: 2000,
        shippingAddress: 'Calle Real 456',
        paymentMethod: paymentMethod.id,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies)
        .send(dto);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.CREATED);
      expect(data.totalAmount).toEqual(dto.totalAmount);
    });

    it('/ should create a sale, return 201 with seller cookies', async () => {
      const dto: CreateSaleDto = {
        totalAmount: 2500,
        shippingAddress: 'Avenida Central 789',
        paymentMethod: paymentMethod.id,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies)
        .send(dto);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.CREATED);
      expect(data.totalAmount).toEqual(dto.totalAmount);
    });

    it('/ should return 401 without cookies', async () => {
      const dto: CreateSaleDto = {
        totalAmount: 1500,
        shippingAddress: 'Calle Falsa 123',
        paymentMethod: paymentMethod.id,
      };
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .send(dto);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('/ should not create a sale, return 401 with invalid api key', async () => {
      const dto: CreateSaleDto = {
        totalAmount: 1500,
        shippingAddress: 'Calle Falsa 123',
        paymentMethod: paymentMethod.id,
      };
      const res = await request(app.getHttpServer())
        .post(`${PATH}`)
        .set('x-api-key', 'invalid-api-key')
        .set('Cookie', customerCookies)
        .send(dto);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should not create a sale, return 401 if api key is missing', async () => {
      const dto: CreateSaleDto = {
        totalAmount: 1500,
        shippingAddress: 'Calle Falsa 123',
        paymentMethod: paymentMethod.id,
      };
      const res = await request(app.getHttpServer())
        .post(`${PATH}`)
        .set('Cookie', customerCookies)
        .send(dto);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDataSource();
  });
});
