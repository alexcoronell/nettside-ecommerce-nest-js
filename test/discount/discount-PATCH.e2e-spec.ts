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

/* DTO's */
import { UpdateDiscountDto } from '@discount/dto/update-discount.dto';

/* Faker */
import { generateManyDiscounts } from '@faker/discount.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

describe('DiscountController (e2e) [PATCH]', () => {
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

  describe('PATCH Discount', () => {
    it('/:id should update a discount with admin cookies', async () => {
      const newDiscounts = generateManyDiscounts(10);
      const dataNewDiscounts = await repo.save(newDiscounts);
      const id = dataNewDiscounts[0].id;
      const updatedData: UpdateDiscountDto = {
        name: 'Updated name',
        description: 'updated-description',
      };
      const res = await request(app.getHttpServer())
        .patch(`/discount/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies)
        .send(updatedData);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.name).toBe(updatedData.name);
    });

    it('/:id should return 401 if the user is seller', async () => {
      const newDiscounts = generateManyDiscounts(10);
      const dataNewDiscounts = await repo.save(newDiscounts);
      const id = dataNewDiscounts[0].id;
      const updatedData: UpdateDiscountDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/discount/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies)
        .send(updatedData);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/:id should return 401 if the user is customer', async () => {
      const newDiscounts = generateManyDiscounts(10);
      const dataNewDiscounts = await repo.save(newDiscounts);
      const id = dataNewDiscounts[0].id;
      const updatedData: UpdateDiscountDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/discount/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies)
        .send(updatedData);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('should return 404 if discount does not exist', async () => {
      const id = 9999;
      const updatedData: UpdateDiscountDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/discount/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies)
        .send(updatedData);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(404);
      expect(message).toBe(`The Discount with ID: ${id} not found`);
    });

    it('/:id should return 401 if api key is missing', async () => {
      const newDiscounts = generateManyDiscounts(10);
      const dataNewDiscounts = await repo.save(newDiscounts);
      const id = dataNewDiscounts[0].id;
      const updatedData: UpdateDiscountDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/discount/${id}`)
        .set('Cookie', adminCookies)
        .send(updatedData);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Invalid API key');
    });

    it('/:id should return 401 if api key is invalid', async () => {
      const newDiscounts = generateManyDiscounts(10);
      const dataNewDiscounts = await repo.save(newDiscounts);
      const id = dataNewDiscounts[0].id;
      const updatedData: UpdateDiscountDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/discount/${id}`)
        .set('x-api-key', 'invalid-api-key')
        .set('Cookie', adminCookies)
        .send(updatedData);
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
