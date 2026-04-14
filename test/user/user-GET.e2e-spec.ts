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
    adminCookies = resLoginAdmin.cookies;

    const resLoginSeller = await loginSeller(app, repo);
    sellerUser = resLoginSeller.sellerUser;
    sellerCookies = resLoginSeller.cookies;

    const resLoginCustomer = await loginCustomer(app, repo);
    customerUser = resLoginCustomer.customerUser;
    customerCookies = resLoginCustomer.cookies;
  });

  describe('GET User - Count', () => {
    it('/count should return 200 and the total user count not deleted with Admin User', async () => {
      await repo.save(seedUsers);
      const data = await request(app.getHttpServer())
        .get('/user/count')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
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
        .set('Cookie', sellerCookies);
      const { statusCode, error } = data.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('count should return 401 if the user is a customer user', async () => {
      await repo.save(seedUsers);
      const data: any = await request(app.getHttpServer())
        .get('/user/count')
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
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
        .set('Cookie', adminCookies);
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

    it('/ should return 200 with seller user (any authenticated user can list users)', async () => {
      await repo.save(seedUsers);
      const res = await request(app.getHttpServer())
        .get('/user')
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toEqual(seedUsers.length);
    });

    it('/ should return 200 if the user is a customer user (any authenticated user can list users)', async () => {
      await repo.save(seedUsers);
      const data: any = await request(app.getHttpServer())
        .get('/user')
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, data: userData } = data.body;
      expect(statusCode).toBe(200);
      expect(userData.length).toEqual(seedUsers.length);
    });

    it('/:id should return 200 and the user details with admin user', async () => {
      await repo.save(seedUser);
      const res = await request(app.getHttpServer())
        .get(`/user/${seedUser.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
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
        .set('Cookie', sellerCookies);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/:id should return 200 and the user details with the same user with seller user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/user/${sellerUser?.id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies);
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
        .set('Cookie', customerCookies);
      const { statusCode } = data.body;
      expect(statusCode).toBe(200);
    });

    it('/:id should return 401 if the user is a customer and not owner', async () => {
      await repo.save(seedUsers);
      const data: any = await request(app.getHttpServer())
        .get('/user/1')
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
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
        .set('Cookie', adminCookies);
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
        .set('Cookie', sellerCookies);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/:id should return 401 if the user is a customer', async () => {
      await repo.save(seedUser);
      const data: any = await request(app.getHttpServer())
        .get(`/user/${seedUser.email}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies);
      const { statusCode, error, message } = data.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
      expect(message).toBe(
        'Unauthorized: Admin or resource owner access required',
      );
    });
  });

  describe('GET User - Pagination & Filtering', () => {
    beforeEach(async () => {
      await repo.save(seedUsers);
    });

    it('/ should return paginated users with default page and limit', async () => {
      const res = await request(app.getHttpServer())
        .get('/user')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data, meta } = res.body;
      expect(statusCode).toBe(200);
      expect(data).toBeInstanceOf(Array);
      expect(meta).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 10,
          total: seedUsers.length,
        }),
      );
    });

    it('/ should return paginated users with custom page and limit', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?page=1&limit=2')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data, meta } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toBeLessThanOrEqual(2);
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(2);
    });

    it('/ should return correct page data', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?page=2&limit=5')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data, meta } = res.body;
      expect(statusCode).toBe(200);
      expect(data).toBeInstanceOf(Array);
      expect(meta.page).toBe(2);
      expect(meta.limit).toBe(5);
    });

    it('/ should calculate totalPages correctly', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?limit=5')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, meta } = res.body;
      expect(statusCode).toBe(200);
      const expectedTotalPages = Math.ceil(seedUsers.length / 5);
      expect(meta.totalPages).toBe(expectedTotalPages);
    });

    it('/ should indicate hasNextPage correctly', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?page=1&limit=10')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, meta } = res.body;
      expect(statusCode).toBe(200);
      expect(meta.hasNextPage).toBe(seedUsers.length > 10);
    });

    it('/ should indicate hasPreviousPage correctly on first page', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?page=1')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, meta } = res.body;
      expect(statusCode).toBe(200);
      expect(meta.hasPreviousPage).toBe(false);
    });

    it('/ should indicate hasPreviousPage correctly on later page', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?page=2')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, meta } = res.body;
      expect(statusCode).toBe(200);
      expect(meta.hasPreviousPage).toBe(true);
    });

    it('/ should sort by createdAt ASC', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?sortBy=createdAt&sortOrder=ASC')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toBeGreaterThan(0);
    });

    it('/ should sort by createdAt DESC', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?sortBy=createdAt&sortOrder=DESC')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode } = res.body;
      expect(statusCode).toBe(200);
    });

    it('/ should sort by email ASC', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?sortBy=email&sortOrder=ASC')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      const emails = data.map((u: User) => u.email);
      const sortedEmails = [...emails].sort();
      expect(emails).toEqual(sortedEmails);
    });

    it('/ should filter by search term in firstname', async () => {
      const searchTerm = seedUsers[0].firstname.substring(0, 3);
      const res = await request(app.getHttpServer())
        .get(`/user?search=${searchTerm}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      data.forEach((user: User) => {
        expect(user.firstname.toLowerCase()).toContain(
          searchTerm.toLowerCase(),
        );
      });
    });

    it('/ should filter by search term in lastname', async () => {
      const searchTerm = seedUsers[0].lastname.substring(0, 3);
      const res = await request(app.getHttpServer())
        .get(`/user?search=${searchTerm}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      const hasMatch = data.some((user: User) =>
        user.lastname.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      expect(hasMatch).toBe(true);
    });

    it('/ should filter by search term in email', async () => {
      const searchTerm = '@';
      const res = await request(app.getHttpServer())
        .get(`/user?search=${searchTerm}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, meta } = res.body;
      expect(statusCode).toBe(200);
      expect(meta.total).toBeGreaterThan(0);
    });

    it('/ should filter by role using filterBy JSON', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/user?filterBy=${encodeURIComponent(JSON.stringify({ role: 'Seller' }))}`,
        )
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      expect(res.body.statusCode).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('/ should filter by isActive using filterBy JSON', async () => {
      const isActive = true;
      const res = await request(app.getHttpServer())
        .get(
          `/user?filterBy=${encodeURIComponent(JSON.stringify({ isActive }))}`,
        )
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      data.forEach((user: User) => {
        expect(user.isActive).toBe(isActive);
      });
    });

    it('/ should combine pagination and search', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?page=1&limit=2&search=test')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data, meta } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toBeLessThanOrEqual(2);
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(2);
    });

    it('/ should combine pagination and sort', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?page=1&limit=5&sortBy=email&sortOrder=ASC')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, meta } = res.body;
      expect(statusCode).toBe(200);
      expect(meta.limit).toBe(5);
    });

    it('/ should return empty data when page exceeds total', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?page=100&limit=10')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data, meta } = res.body;
      expect(statusCode).toBe(200);
      expect(data).toEqual([]);
      expect(meta.page).toBe(100);
    });

    it('/ should handle limit of 1', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?limit=1')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data, meta } = res.body;
      expect(statusCode).toBe(200);
      expect(data.length).toBe(1);
      expect(meta.limit).toBe(1);
    });

    it('/ should handle limit of 100 (max)', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?limit=100')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, meta } = res.body;
      expect(statusCode).toBe(200);
      expect(meta.limit).toBe(100);
    });

    it('/ should cap limit at 100', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?limit=500')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, meta } = res.body;
      expect(statusCode).toBe(200);
      expect(meta.limit).toBe(100);
    });

    it('/ should normalize page 0 to 1', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?page=0')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, meta } = res.body;
      expect(statusCode).toBe(200);
      expect(meta.page).toBe(1);
    });

    it('/ should sort by firstname ASC', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?sortBy=firstname&sortOrder=ASC')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      const firstnames = data.map((u: User) => u.firstname);
      const sortedFirstnames = [...firstnames].sort();
      expect(firstnames).toEqual(sortedFirstnames);
    });

    it('/ should sort by lastname DESC', async () => {
      const res = await request(app.getHttpServer())
        .get('/user?sortBy=lastname&sortOrder=DESC')
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies);
      const { statusCode } = res.body;
      expect(statusCode).toBe(200);
    });
  });

  afterAll(async () => {
    await app.close();
    // Close database connection after all tests
    await closeDataSource();
  });
});
