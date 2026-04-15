/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as cookieParser from 'cookie-parser';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reflector, APP_INTERCEPTOR } from '@nestjs/core';

/* Modules */
import { AppModule } from '../../src/app.module';
import { DiscountModule } from '@discount/discount.module';
import { UserModule } from '@user/user.module';

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* Faker */
import { generateDiscount, generateManyDiscounts } from '@faker/discount.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

describe('DiscountController (e2e) [GET]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoUser: any = undefined;
  let adminCookies: string[];
  let sellerCookies: string[];
  let customerCookies: string[];

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
        DiscountModule,
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
    repo = app.get('DiscountRepository');
    repoUser = app.get('UserRepository');
  });

  beforeEach(async () => {
    // Clean all data before each test to ensure isolation
    await cleanDB();

    /* Login Users */
    const resLoginAdmin = await loginAdmin(app, repoUser);
    adminCookies = resLoginAdmin.cookies;
    const resLoginSeller = await loginSeller(app, repoUser);
    sellerCookies = resLoginSeller.cookies;
    const resLoginCustomer = await loginCustomer(app, repoUser);
    customerCookies = resLoginCustomer.cookies;
  });

  describe('GET Discount - Count', () => {
    it('/count should return 200 with admin cookies', async () => {
      const discounts = generateManyDiscounts(10);
      await repo.save(discounts);
      const res = await request(app.getHttpServer())
        .get('/discount/count')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(discounts.length);
    });

    it('/count should return 200 with seller cookies', async () => {
      const discounts = generateManyDiscounts(10);
      await repo.save(discounts);
      const res = await request(app.getHttpServer())
        .get('/discount/count')
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(discounts.length);
    });

    it('/count should return 401 with customer cookies', async () => {
      const res = await request(app.getHttpServer())
        .get('/discount/count')
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Unauthorized: Customer access denied');
    });

    it('/count should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer()).get(
        '/discount/count',
      );
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/count should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .get('/discount/count')
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });
  });

  describe('GET Discount - / Find', () => {
    it('/ should return all discounts with admin cookies', async () => {
      const discounts = generateManyDiscounts(10);
      await repo.save(discounts);
      const res = await request(app.getHttpServer())
        .get('/discount')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(discounts.length);
      data.forEach((data) => {
        const discount = discounts.find((su) => su.code === data.code);
        expect(data).toEqual(
          expect.objectContaining({
            code: discount?.code,
          }),
        );
      });
    });

    it('/ should return all discounts with seller cookies', async () => {
      const discounts = generateManyDiscounts(10);
      await repo.save(discounts);
      const res = await request(app.getHttpServer())
        .get('/discount')
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(discounts.length);
      data.forEach((data) => {
        const discount = discounts.find((su) => su.code === data.code);
        expect(data).toEqual(
          expect.objectContaining({
            code: discount?.code,
          }),
        );
      });
    });

    it('/ should return 401 with customer cookies', async () => {
      const discounts = generateManyDiscounts(10);
      await repo.save(discounts);
      const res = await request(app.getHttpServer())
        .get('/discount')
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/ should return all discounts without logged user', async () => {
      const discounts = generateManyDiscounts(10);
      await repo.save(discounts);
      const res = await request(app.getHttpServer())
        .get('/discount')
        .set('x-api-key', API_KEY);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Unauthorized');
    });

    it('/ should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer()).get('/discount');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/ should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .get('/discount')
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });
  });

  describe('GET Discount - /:id FindOne', () => {
    it('/:id should return one discount by id with admin cookies', async () => {
      const discount = generateDiscount(1);
      const savedDiscount = await repo.save(discount);
      const res = await request(app.getHttpServer())
        .get(`/discount/${savedDiscount.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(savedDiscount.id);
      expect(data.code).toEqual(savedDiscount.code);
    });

    it('/:id should return one discount by id with seller cookies', async () => {
      const discount = generateDiscount(2);
      const savedDiscount = await repo.save(discount);
      const res = await request(app.getHttpServer())
        .get(`/discount/${savedDiscount.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(savedDiscount.id);
      expect(data.code).toEqual(savedDiscount.code);
    });

    it('/:id should return 401 by id with customer cookies', async () => {
      const discount = generateDiscount(3);
      const savedDiscount = await repo.save(discount);
      const res = await request(app.getHttpServer())
        .get(`/discount/${savedDiscount.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe('Unauthorized: Customer access denied');
    });

    it('/:id should return 401 by id without access token', async () => {
      const discount = generateDiscount(4);
      const savedDiscount = await repo.save(discount);
      const res = await request(app.getHttpServer())
        .get(`/discount/${savedDiscount.id}`)
        .set('x-api-key', API_KEY);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Unauthorized');
    });

    it('/:id should return 401 by id without api key', async () => {
      const discount = generateDiscount(5);
      const savedDiscount = await repo.save(discount);
      const res = await request(app.getHttpServer())
        .get(`/discount/${savedDiscount.id}`)
        .set('Cookie', adminCookies);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Invalid API key');
    });

    it('/:id should return 404 by id if discount does not exist', async () => {
      const res = await request(app.getHttpServer())
        .get(`/discount/9999999`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(404);
      expect(error).toBe('Not Found');
      expect(message).toBe('The Discount with ID: 9999999 not found');
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
