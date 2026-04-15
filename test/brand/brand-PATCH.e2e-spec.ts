/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { App } from 'supertest/types';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reflector, APP_INTERCEPTOR } from '@nestjs/core';

/* Modules */
import { AppModule } from '../../src/app.module';
import { BrandModule } from '@brand/brand.module';
import { UserModule } from '@user/user.module';
import { UploadModule } from '@upload/upload.module';

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* DTO's */
import { UpdateBrandDto } from '@brand/dto/update-brand.dto';

/* Faker */
import { generateManyBrands } from '@faker/brand.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

describe('BrandController (e2e) [PATCH]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoUser: any = undefined;
  let adminCookies: string[];
  let sellerCookies: string[];
  let customerCookies: string[];

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
        BrandModule,
        UserModule,
        UploadModule,
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
    repo = app.get('BrandRepository');
    repoUser = app.get('UserRepository');
    const brands = generateManyBrands(10);
    await repo.save(brands);
  });

  beforeEach(async () => {
    await cleanDB();

    const resLoginAdmin = await loginAdmin(app, repoUser);
    adminCookies = resLoginAdmin.cookies;

    const resLoginSeller = await loginSeller(app, repoUser);
    sellerCookies = resLoginSeller.cookies;

    const resLoginCustomer = await loginCustomer(app, repoUser);
    customerCookies = resLoginCustomer.cookies;
  });

  describe('PATCH Brand', () => {
    it('/:id should update a brand with multipart form data', async () => {
      const newBrands = generateManyBrands(10);
      const dataNewBrands = await repo.save(newBrands);
      const id = dataNewBrands[0].id;
      const updatedData: UpdateBrandDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/brand/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies)
        .field('name', updatedData.name!);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.name).toBe(updatedData.name);
    });

    it('/:id should update brand logo with new file', async () => {
      const newBrands = generateManyBrands(10);
      const dataNewBrands = await repo.save(newBrands);
      const id = dataNewBrands[0].id;
      const res = await request(app.getHttpServer())
        .patch(`/brand/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies)
        .attach('file', Buffer.from('fake-image-content'), 'new-logo.png');
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.logo).toContain('brand-logos/');
    });

    it('/:id should update brand without changing logo', async () => {
      const newBrands = generateManyBrands(10);
      const dataNewBrands = await repo.save(newBrands);
      const id = dataNewBrands[0].id;
      const res = await request(app.getHttpServer())
        .patch(`/brand/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies)
        .field('name', 'New Name Only');
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(200);
      expect(data.name).toBe('New Name Only');
    });

    it('/:id should return 401 if the user is seller', async () => {
      const newBrands = generateManyBrands(10);
      const dataNewBrands = await repo.save(newBrands);
      const id = dataNewBrands[0].id;
      const updatedData: UpdateBrandDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/brand/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', sellerCookies)
        .field('name', updatedData.name!);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/:id should return 401 if the user is customer', async () => {
      const newBrands = generateManyBrands(10);
      const dataNewBrands = await repo.save(newBrands);
      const id = dataNewBrands[0].id;
      const updatedData: UpdateBrandDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/brand/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', customerCookies)
        .field('name', updatedData.name!);
      const { statusCode, error } = res.body;
      expect(statusCode).toBe(401);
      expect(error).toBe('Unauthorized');
    });

    it('/:id should return Conflict if brand name is already taken', async () => {
      const newBrands = await repo.save(generateManyBrands(10));

      const brand = newBrands[0];
      const id = newBrands[1].id;

      const updatedData: UpdateBrandDto = {
        name: brand.name!,
      };
      try {
        await request(app.getHttpServer())
          .patch(`/brand/${id}`)
          .set('x-api-key', API_KEY)
          .set('Cookie', adminCookies)
          .field('name', updatedData.name!);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          `The Brand NAME ${updatedData.name} is already in use`,
        );
      }
    });

    it('should return 404 if brand does not exist', async () => {
      const id = 9999;
      const updatedData: UpdateBrandDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/brand/${id}`)
        .set('x-api-key', API_KEY)
        .set('Cookie', adminCookies)
        .field('name', updatedData.name!);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(404);
      expect(message).toBe(`The Brand with ID: ${id} not found`);
    });

    it('/:id should return 401 if api key is missing', async () => {
      const newBrands = generateManyBrands(10);
      const dataNewBrands = await repo.save(newBrands);
      const id = dataNewBrands[0].id;
      const updatedData: UpdateBrandDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/brand/${id}`)
        .set('Cookie', adminCookies)
        .field('name', updatedData.name!);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Invalid API key');
    });

    it('/:id should return 401 if api key is invalid', async () => {
      const newBrands = generateManyBrands(10);
      const dataNewBrands = await repo.save(newBrands);
      const id = dataNewBrands[0].id;
      const updatedData: UpdateBrandDto = {
        name: 'Updated name',
      };
      const res = await request(app.getHttpServer())
        .patch(`/brand/${id}`)
        .set('x-api-key', 'invalid-api-key')
        .set('Cookie', adminCookies)
        .field('name', updatedData.name!);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(401);
      expect(message).toBe('Invalid API key');
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDataSource();
  });
});
