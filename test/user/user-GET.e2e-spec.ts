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
import { UserModule } from '@user/user.module';

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

/* Entities */
import { User } from '@user/entities/user.entity';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* Faker */

/* User Seed */
import { seedUser, seedUsers } from '../utils/user.seed';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

const API_KEY = process.env.API_KEY || 'api-e2e-key';

describe('UserControler (e2e) [GET]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let sellerUser: User | null = null;
  let customerUser: User | null = null;
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
    repo = app.get('UserRepository');
  });

  beforeEach(async () => {
    // Clean all data before each test to ensure isolation
    await cleanDB();

    /* Login Users */
    const resLoginAdmin = await loginAdmin(app, repo);
    adminAccessToken = resLoginAdmin.access_token;

    const resLoginSeller = await loginSeller(app, repo);
    sellerUser = resLoginSeller.sellerUser;
    sellerAccessToken = resLoginSeller.access_token;

    const resLoginCustomer = await loginCustomer(app, repo);
    customerUser = resLoginCustomer.customerUser;
    customerAccessToken = resLoginCustomer.access_token;
  });

  describe('GET User - Count', () => {
    it('/count should return 200 and the total user count not deleted with Admin User', async () => {
      await repo.save(seedUsers);
      const data = await request(app.getHttpServer())
        .get('/user/count')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, total } = data.body;
      expect(statusCode).toBe(200);
      expect(total).toEqual(seedUsers.length);
    });

    it('/count should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer()).get('/user/count');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/count should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .get('/user/count')
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/count should return 401 if the user is a seller user', async () => {
      await repo.save(seedUsers);
      const data: any = await request(app.getHttpServer())
        .get('/user/count')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, error } = data.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('count should return 401 if the user is a customer user', async () => {
      await repo.save(seedUsers);
      const data: any = await request(app.getHttpServer())
        .get('/user/count')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, error, message } = data.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe('Unauthorized: Admin access required');
    });
  });

  describe('GET User - Find', () => {
    it('/ should return all users with Admin User', async () => {
      await repo.save(seedUsers);
      const res = await request(app.getHttpServer())
        .get('/user')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(seedUsers.length);
      data.forEach((user) => {
        const seedUser = seedUsers.find((su) => su.id === user.id);
        expect(user).toEqual(
          expect.objectContaining({
            id: seedUser?.id,
            firstname: seedUser?.firstname,
            lastname: seedUser?.lastname,
            email: seedUser?.email,
            role: seedUser?.role,
          }),
        );
      });
    });

    it('/ should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer()).get('/user');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/ should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .get('/user')
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/ should return 401 with the user is seller user', async () => {
      await repo.save(seedUsers);
      const res = await request(app.getHttpServer())
        .get('/user')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/ should return 401 if the user is a customer user', async () => {
      await repo.save(seedUsers);
      const data: any = await request(app.getHttpServer())
        .get('/user')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, error, message } = data.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe('Unauthorized: Admin access required');
    });

    it('/:id should return 200 and the user details with admin user', async () => {
      await repo.save(seedUser);
      const res = await request(app.getHttpServer())
        .get(`/user/${seedUser.id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(seedUser.id);
      expect(data.firstname).toEqual(seedUser.firstname);
      expect(data.lastname).toEqual(seedUser.lastname);
      expect(data.email).toEqual(seedUser.email);
      expect(data.role).toEqual(seedUser.role);
    });

    it('/:id should return 401 if api key is missing', async () => {
      const id = seedUser.id;
      const data: any = await request(app.getHttpServer()).get(`/user/${id}`);
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/:id should return 401 if api key is invalid', async () => {
      const id = seedUser.id;
      const data: any = await request(app.getHttpServer())
        .get(`/user/:${id}`)
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/:id should return 401 and error message with no admin user', async () => {
      await repo.save(seedUser);
      const res = await request(app.getHttpServer())
        .get(`/user/${seedUser.id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/:id should return 200 and the user details with the same user with seller user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/user/${sellerUser?.id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(sellerUser?.id);
      expect(data.firstname).toEqual(sellerUser?.firstname);
      expect(data.lastname).toEqual(sellerUser?.lastname);
      expect(data.email).toEqual(sellerUser?.email);
      expect(data.role).toEqual(sellerUser?.role);
    });

    it('/:id should return 200 if the user is a customer and the owner', async () => {
      const { id } = customerUser as User;
      const data: any = await request(app.getHttpServer())
        .get(`/user/${id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode } = data.body;
      expect(statusCode).toBe(200);
    });

    it('/:id should return 401 if the user is a customer and not owner', async () => {
      await repo.save(seedUsers);
      const data: any = await request(app.getHttpServer())
        .get('/user/1')
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, error, message } = data.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe(
        'Unauthorized: Admin or resource owner access required',
      );
    });

    it('/email/:email should return 200 and the user details with admin user', async () => {
      await repo.save(seedUser);
      const res = await request(app.getHttpServer())
        .get(`/user/email/${seedUser.email}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.id).toEqual(seedUser.id);
      expect(data.firstname).toEqual(seedUser.firstname);
      expect(data.lastname).toEqual(seedUser.lastname);
      expect(data.email).toEqual(seedUser.email);
      expect(data.role).toEqual(seedUser.role);
    });

    it('/email/:email should return 401 if api key is missing', async () => {
      const email = seedUser.email;
      const data: any = await request(app.getHttpServer()).get(
        `/user/email/${email}`,
      );
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/email/:email should return 401 if api key is invalid', async () => {
      const email = seedUser.email;
      const data: any = await request(app.getHttpServer())
        .get(`/user/email/:${email}`)
        .set('x-api-key', 'invalid-api-key');
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('/email/:email should return 401 and error message with no admin user', async () => {
      await repo.save(seedUser);
      const res = await request(app.getHttpServer())
        .get(`/user/email/${seedUser.email}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/:id should return 401 if the user is a customer', async () => {
      await repo.save(seedUser);
      const data: any = await request(app.getHttpServer())
        .get(`/user/${seedUser.email}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`);
      const { statusCode, error, message } = data.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe(
        'Unauthorized: Admin or resource owner access required',
      );
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
