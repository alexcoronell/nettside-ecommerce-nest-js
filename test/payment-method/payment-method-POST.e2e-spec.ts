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
  generatePaymentMethod,
} from '@faker/paymentMethod.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

describe('CategoryController (e2e) [POST]', () => {
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

  describe('POST payment method', () => {
    it('/ should create a payment method, return 201 and the payment method with admin user', async () => {
      const newPaymentMethod = createPaymentMethod();
      const res = await request(app.getHttpServer())
        .post('/payment-method')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newPaymentMethod);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(201);
      expect(data.name).toEqual(newPaymentMethod.name);
    });

    it('/ should create a payment method, return 401 if user is seller', async () => {
      const newPaymentMethod = createPaymentMethod();
      const res = await request(app.getHttpServer())
        .post('/payment-method')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`)
        .send(newPaymentMethod);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/ should create a payment method, return 401 if user is custonmer', async () => {
      const newPaymentMethod = createPaymentMethod();
      const res = await request(app.getHttpServer())
        .post('/payment-method')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(newPaymentMethod);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/ should return a  conflict exception with existing category name', async () => {
      const newPaymentMethod = generatePaymentMethod();
      await repo.save(newPaymentMethod);
      const repeatedPaymentMethod = {
        ...createPaymentMethod(),
        name: newPaymentMethod.name,
      };
      try {
        await request(app.getHttpServer())
          .post('/payment-method')
          .send(repeatedPaymentMethod);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          `The Payment Method NAME ${repeatedPaymentMethod.name} is already in use`,
        );
      }
    });

    it('/ should create a payment method, return 401 if api key is missing', async () => {
      const newPaymentMethod = createPaymentMethod();
      const res = await request(app.getHttpServer())
        .post('/payment-method')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newPaymentMethod);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Invalid API key');
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
