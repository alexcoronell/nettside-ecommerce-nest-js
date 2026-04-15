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
import { PaymentMethodModule } from '@payment_method/payment-method.module';
import { UserModule } from '@user/user.module';

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* Faker */
import {
  createPaymentMethod,
  generateManyPaymentMethods,
} from '@faker/paymentMethod.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

describe('PaymentMethodController (e2e) [GET]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoUser: any = undefined;
  let adminAccessToken: string;
  let sellerAccessToken: string;
  let customerAccessToken: string;

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
    await app.init();
    repo = app.get('PaymentMethodRepository');
    repoUser = app.get('UserRepository');
  });

  beforeEach(async () => {
    // Clean all data before each test to ensure isolation
    await cleanDB();

    /* Login Users */
    const resLoginAdmin = await loginAdmin(app, repoUser);
    adminAccessToken = resLoginAdmin.access_token;
    const resLoginSeller = await loginSeller(app, repoUser);
    sellerAccessToken = resLoginSeller.access_token;
    const resLoginCustomer = await loginCustomer(app, repoUser);
    customerAccessToken = resLoginCustomer.access_token;
  });

  describe('GET Payment Method - Count-All', () => {
    it('/count-all should return 200 with admin access token', async () => {
      const paymentMethods = generateManyPaymentMethods(10);
      await repo.save(paymentMethods);
      const res = await request(app.getHttpServer())
        .get('/payment-method/count-all')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(paymentMethods.length);
    });

    it('/count-all should return 200 with seller access token', async () => {
      const paymentMethods = generateManyPaymentMethods(10);
      await repo.save(paymentMethods);
      const res = await request(app.getHttpServer())
        .get('/payment-method/count-all')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(paymentMethods.length);
    });

    it('/count-all should return 401 with customer access token', async () => {
      const res = await request(app.getHttpServer())
        .get('/payment-method/count-all')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Unauthorized: Customer access denied');
    });

    it('/count-all should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer()).get(
        '/payment-method/count-all',
      );
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/count-all should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .get('/payment-method/count-all')
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });
  });

  describe('GET Payment Method - Count', () => {
    it('/count should return 200 with admin access token', async () => {
      const paymentMethods = generateManyPaymentMethods(10);
      await repo.save(paymentMethods);
      const res = await request(app.getHttpServer())
        .get('/payment-method/count')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(paymentMethods.length);
    });

    it('/count should return 200 with seller access token', async () => {
      const paymentMethods = generateManyPaymentMethods(10);
      await repo.save(paymentMethods);
      const res = await request(app.getHttpServer())
        .get('/payment-method/count')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(paymentMethods.length);
    });

    it('/count should return 401 with customer access token', async () => {
      const res = await request(app.getHttpServer())
        .get('/payment-method/count')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Unauthorized: Customer access denied');
    });

    it('/count should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer()).get(
        '/payment-method/count',
      );
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/count should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .get('/payment-method/count')
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });
  });

  describe('GET Payment Method - / Find', () => {
    it('/ should return all payment methods with admin user', async () => {
      const paymentMethods = generateManyPaymentMethods(10);
      await repo.save(paymentMethods);
      const res = await request(app.getHttpServer())
        .get('/payment-method')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(paymentMethods.length);
      data.forEach((data) => {
        const paymentMethod = paymentMethods.find(
          (su) => su.name === data.name,
        );
        expect(data).toEqual(
          expect.objectContaining({
            name: paymentMethod?.name,
          }),
        );
      });
    });

    it('/ should return all payment methods with seller user', async () => {
      const paymentMethods = generateManyPaymentMethods(10);
      await repo.save(paymentMethods);
      const res = await request(app.getHttpServer())
        .get('/payment-method')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(paymentMethods.length);
      data.forEach((data) => {
        const paymentMethod = paymentMethods.find(
          (su) => su.name === data.name,
        );
        expect(data).toEqual(
          expect.objectContaining({
            name: paymentMethod?.name,
          }),
        );
      });
    });

    it('/ should return 401 with customer user', async () => {
      const paymentMethods = generateManyPaymentMethods(10);
      await repo.save(paymentMethods);
      const res = await request(app.getHttpServer())
        .get('/payment-method')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/ should return all payment methods without logged user', async () => {
      const paymentMethods = generateManyPaymentMethods(10);
      await repo.save(paymentMethods);
      const res = await request(app.getHttpServer())
        .get('/payment-method')
        .set('x-api-key', API_KEY);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Unauthorized');
    });

    it('/ should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer()).get(
        '/payment-method',
      );
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/ should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .get('/payment-method')
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });
  });

  describe('GET Payment Method - /:id FindOne', () => {
    it('/:id should return one Payment Method by id with admin user', async () => {
      const paymentMethod = createPaymentMethod();
      const dataNewPaymentMethod = await repo.save(paymentMethod);
      const res = await request(app.getHttpServer())
        .get(`/payment-method/${dataNewPaymentMethod.id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(dataNewPaymentMethod.id);
      expect(data.name).toEqual(dataNewPaymentMethod.name);
    });

    it('/:id should return one Payment Method by id with seller user', async () => {
      const paymentMethod = createPaymentMethod();
      const dataNewPaymentMethod = await repo.save(paymentMethod);
      const res = await request(app.getHttpServer())
        .get(`/payment-method/${dataNewPaymentMethod.id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(dataNewPaymentMethod.id);
      expect(data.name).toEqual(dataNewPaymentMethod.name);
    });

    it('/:id should return 401 by id with customer access token', async () => {
      const paymentMethod = createPaymentMethod();
      const dataNewPaymentMethod = await repo.save(paymentMethod);
      const res = await request(app.getHttpServer())
        .get(`/payment-method/${dataNewPaymentMethod.id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe('Unauthorized: Customer access denied');
    });

    it('/:id should return 401 by id without access token', async () => {
      const paymentMethod = createPaymentMethod();
      const dataNewPaymentMethod = await repo.save(paymentMethod);
      const res = await request(app.getHttpServer())
        .get(`/payment-method/${dataNewPaymentMethod.id}`)
        .set('x-api-key', API_KEY);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Unauthorized');
    });

    it('/:id should return 401 by id without api key', async () => {
      const paymentMethod = createPaymentMethod();
      const dataNewPaymentMethod = await repo.save(paymentMethod);
      const res = await request(app.getHttpServer())
        .get(`/payment-method/${dataNewPaymentMethod.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Invalid API key');
    });

    it('/:id should return 404 by id if Payment Method does not exist', async () => {
      const paymentMethod = createPaymentMethod();
      await repo.save(paymentMethod);
      const res = await request(app.getHttpServer())
        .get(`/payment-method/9999999`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(404);
      expect(error).toBe('Not Found');
      expect(message).toBe('The Payment Method with ID: 9999999 not found');
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
