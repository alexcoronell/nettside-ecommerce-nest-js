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
import { UserModule } from '@user/user.module';

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* Faker */
import { createBrand, generateNewBrands } from '@faker/brand.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

describe('BrandController (e2e) [GET]', () => {
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
        BrandModule,
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
    repo = app.get('BrandRepository');
    repoUser = app.get('UserRepository');
    const brands = generateNewBrands(10);
    await repo.save(brands);
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

  describe('GET Brand - Count', () => {
    it('/count should return 200 with admin access token', async () => {
      const brands = generateNewBrands(10);
      await repo.save(brands);
      const res = await request(app.getHttpServer())
        .get('/brand/count')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(brands.length);
    });

    it('/count should return 200 with seller access token', async () => {
      const brands = generateNewBrands(10);
      await repo.save(brands);
      const res = await request(app.getHttpServer())
        .get('/brand/count')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, total } = res.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(brands.length);
    });

    it('/count should return 401 with customer access token', async () => {
      const res = await request(app.getHttpServer())
        .get('/brand/count')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Unauthorized: Customer access denied');
    });

    it('/count should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer()).get('/brand/count');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/count should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .get('/brand/count')
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });
  });

  describe('GET Brand - / Find', () => {
    it('/ should return all brands without logged user', async () => {
      const brands = generateNewBrands(10);
      await repo.save(brands);
      const res = await request(app.getHttpServer())
        .get('/brand')
        .set('x-api-key', API_KEY);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(brands.length);
      data.forEach((user) => {
        const brand = brands.find((su) => su.name === user.name);
        expect(user).toEqual(
          expect.objectContaining({
            name: brand?.name,
          }),
        );
      });
    });

    it('/ should return all brands with admin user', async () => {
      const brands = generateNewBrands(10);
      await repo.save(brands);
      const res = await request(app.getHttpServer())
        .get('/brand')
        .set('x-api-key', API_KEY)
        .set('Authorization', adminAccessToken);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(brands.length);
      data.forEach((user) => {
        const brand = brands.find((su) => su.name === user.name);
        expect(user).toEqual(
          expect.objectContaining({
            name: brand?.name,
          }),
        );
      });
    });

    it('/ should return all brands with seller user', async () => {
      const brands = generateNewBrands(10);
      await repo.save(brands);
      const res = await request(app.getHttpServer())
        .get('/brand')
        .set('x-api-key', API_KEY)
        .set('Authorization', sellerAccessToken);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(brands.length);
      data.forEach((user) => {
        const brand = brands.find((su) => su.name === user.name);
        expect(user).toEqual(
          expect.objectContaining({
            name: brand?.name,
          }),
        );
      });
    });

    it('/ should return all brands with customer user', async () => {
      const brands = generateNewBrands(10);
      await repo.save(brands);
      const res = await request(app.getHttpServer())
        .get('/brand')
        .set('x-api-key', API_KEY)
        .set('Authorization', customerAccessToken);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(brands.length);
      data.forEach((user) => {
        const brand = brands.find((su) => su.name === user.name);
        expect(user).toEqual(
          expect.objectContaining({
            name: brand?.name,
          }),
        );
      });
    });

    it('/ should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer()).get('/brand');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/ should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .get('/brand')
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });
  });

  describe('GET Brand - / FindOne', () => {
    it('/:id should return an brand by id with admin user', async () => {
      const brand = createBrand();
      const dataNewBrand = await repo.save(brand);
      const res = await request(app.getHttpServer())
        .get(`/brand/${dataNewBrand.id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(dataNewBrand.id);
      expect(data.name).toEqual(dataNewBrand.name);
    });

    it('/:id should return an brand by id with seller user', async () => {
      const brand = createBrand();
      const dataNewBrand = await repo.save(brand);
      const res = await request(app.getHttpServer())
        .get(`/brand/${dataNewBrand.id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(dataNewBrand.id);
      expect(data.name).toEqual(dataNewBrand.name);
    });

    it('/:id should return 401 by id with customer access token', async () => {
      const brand = createBrand();
      const dataNewBrand = await repo.save(brand);
      const res = await request(app.getHttpServer())
        .get(`/brand/${dataNewBrand.id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe('Unauthorized: Customer access denied');
    });

    it('/name/:name should return 404 by id if brand does not exist', async () => {
      const brand = createBrand();
      await repo.save(brand);
      const res = await request(app.getHttpServer())
        .get(`/brand/9999999`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(404);
      expect(error).toBe('Not Found');
      expect(message).toBe('The Brand with ID: 9999999 not found');
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
