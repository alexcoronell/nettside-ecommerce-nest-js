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

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* Faker */
import { generateNewPaymentMethods } from '@faker/paymentMethod.faker';
import { generateManySales } from '@faker/sale.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* Constants */
import { ERROR_MESSAGES, HTTP_STATUS } from '../../src/commons/constants';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/sale';
const COUNT_ALL = `${PATH}/count-all`;
const COUNT = `${PATH}/count`;
const ID = 1;

describe('SaleController (e2e) [GET]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoPaymentMethod: any = undefined;
  let repoUser: any = undefined;
  let adminCookies: string[];
  let sellerCookies: string[];
  let customerCookies: string[];
  let paymentMethod: any;
  let sales: any[] = [];

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

    /* Create Payment Methods */
    const newPaymentMethods = generateNewPaymentMethods(5);
    const paymentMethods = await repoPaymentMethod.save(newPaymentMethods);
    paymentMethod = paymentMethods[0];

    /* Create Sales */
    const newSales = generateManySales(5);
    for (const sale of newSales) {
      sale.paymentMethod = paymentMethod;
    }
    sales = await repo.save(newSales);
  });

  describe('GET Sale - Count-All', () => {
    it('/count-all should return HTTP_STATUS.UNAUTHORIZED if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(COUNT_ALL);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/count-all should return HTTP_STATUS.UNAUTHORIZED if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(COUNT_ALL)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/count-all should return HTTP_STATUS.OK with admin cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT_ALL)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(total).toEqual(sales.length);
    });

    it('/count-all should return HTTP_STATUS.UNAUTHORIZED with seller cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT_ALL)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
    });

    it('/count-all should return HTTP_STATUS.UNAUTHORIZED with customer cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT_ALL)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
    });

    it('/count-all should return HTTP_STATUS.UNAUTHORIZED without cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT_ALL)
        .set('x-api-key', API_KEY);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(total).toBeUndefined();
    });
  });

  describe('GET Sale - Count', () => {
    it('/count should return HTTP_STATUS.UNAUTHORIZED if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(COUNT);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/count should return HTTP_STATUS.UNAUTHORIZED if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/count should return HTTP_STATUS.OK with admin cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(total).toBeGreaterThanOrEqual(0);
    });

    it('/count should return HTTP_STATUS.UNAUTHORIZED with seller cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
    });

    it('/count should return HTTP_STATUS.UNAUTHORIZED with customer cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
    });

    it('/count should return HTTP_STATUS.UNAUTHORIZED without cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(COUNT)
        .set('x-api-key', API_KEY);
      const { statusCode } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('GET Sale - Find All', () => {
    it('/ should return HTTP_STATUS.UNAUTHORIZED if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(`${PATH}`);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should return HTTP_STATUS.UNAUTHORIZED if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should return all sales with admin cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
    });

    it('/ should return HTTP_STATUS.UNAUTHORIZED with seller cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
    });

    it('/ should return HTTP_STATUS.UNAUTHORIZED with customer cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
    });

    it('/ should return HTTP_STATUS.UNAUTHORIZED without cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}`)
        .set('x-api-key', API_KEY);
      const { statusCode } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('GET Sale - Find By Id', () => {
    it('/:id should return HTTP_STATUS.UNAUTHORIZED if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(`${PATH}/${ID}`);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/:id should return HTTP_STATUS.UNAUTHORIZED if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/:id should return a sale by id with admin cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
      expect(data.id).toBeDefined();
      expect(data.totalAmount).toBeDefined();
    });

    it('/:id should return HTTP_STATUS.UNAUTHORIZED with seller cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
    });

    it('/:id should return HTTP_STATUS.UNAUTHORIZED with customer cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
    });

    it('/:id should return HTTP_STATUS.NOT_FOUND for non-existent sale', async () => {
      const nonExistentId = 9999;
      const res = await request(app.getHttpServer())
        .get(`${PATH}/${nonExistentId}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(message).toBe(`Sale with ID ${nonExistentId} not found`);
    });
  });

  describe('GET Sale - Find By User', () => {
    it('/user/:userId should return HTTP_STATUS.UNAUTHORIZED if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(`${PATH}/user/1`);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/user/:userId should return HTTP_STATUS.UNAUTHORIZED if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(`${PATH}/user/1`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/user/:userId should return sales by user with admin cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/user/1`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
    });

    it('/user/:userId should return HTTP_STATUS.UNAUTHORIZED with seller cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/user/1`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
    });

    it('/user/:userId should return HTTP_STATUS.UNAUTHORIZED with customer cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/user/1`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
    });
  });

  describe('GET Sale - Find By Payment Method', () => {
    it('/payment-method/:id should return HTTP_STATUS.UNAUTHORIZED if api key is missing', async () => {
      const res: any = await request(app.getHttpServer()).get(
        `${PATH}/payment-method/${paymentMethod.id}`,
      );
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/payment-method/:id should return HTTP_STATUS.UNAUTHORIZED if api key is invalid', async () => {
      const res: any = await request(app.getHttpServer())
        .get(`${PATH}/payment-method/${paymentMethod.id}`)
        .set('x-api-key', 'invalid-api-key');
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/payment-method/:id should return sales by payment method with admin cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/payment-method/${paymentMethod.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data).toBeDefined();
    });

    it('/payment-method/:id should return HTTP_STATUS.UNAUTHORIZED with seller cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/payment-method/${paymentMethod.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
    });

    it('/payment-method/:id should return HTTP_STATUS.UNAUTHORIZED with customer cookies', async () => {
      const res = await request(app.getHttpServer())
        .get(`${PATH}/payment-method/${paymentMethod.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDataSource();
  });
});
