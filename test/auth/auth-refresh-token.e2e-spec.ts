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
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import config from '@config/index';

/* Modules */
import { AuthModule } from '@auth/auth.module';
import { UserModule } from '@user/user.module';

/* Guards */
import { ApiKeyGuard } from '@commons/guards/api-key.guard';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* User Seed */
import {
  seedNewAdminUser,
  adminPassword,
  seedNewSellerUser,
  sellerPassword,
  seedNewCustomerUser,
  customerPassword,
} from '../utils/user.seed';

describe('AuthController (e2e) REFRESH TOKEN', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let userAdmin: any = undefined;
  let userSeller: any = undefined;
  let userCustomer: any = undefined;
  const API_KEY = process.env.API_KEY || 'api-e2e-key';

  beforeAll(async () => {
    await initDataSource();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.e2e',
          load: [config],
        }),
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            synchronize: true,
            ...dataSource.options,
          }),
        }),
        JwtModule.registerAsync({
          inject: [config.KEY],
          useFactory: (configService: ConfigType<typeof config>) => {
            return {
              secret: configService.jwtSecret,
              signOptions: {
                expiresIn: configService.jwtExpirationTime,
              },
            };
          },
        }),
        AuthModule,
        UserModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ApiKeyGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
    repo = app.get('UserRepository');
  });

  beforeEach(async () => {
    await cleanDB();

    userAdmin = await seedNewAdminUser();
    userSeller = await seedNewSellerUser();
    userCustomer = await seedNewCustomerUser();
    await repo.save(userSeller);
    await repo.save(userCustomer);
    await repo.save(userAdmin);
  });

  describe('POST /auth/refresh', () => {
    it('should return a new access token with Admin User', async () => {
      const user = {
        email: userAdmin.email,
        password: adminPassword,
      };

      const loginResponse: any = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', API_KEY)
        .send(user);

      const cookies = loginResponse.headers['set-cookie'] as string[];

      const data: any = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('x-api-key', API_KEY)
        .set('Cookie', cookies)
        .send();
      const { body, statusCode } = data;
      expect(statusCode).toBe(200);
      expect(body.message).toBe('Token refreshed successfully');

      const newCookies = data.headers['set-cookie'];
      expect(newCookies).toBeDefined();
      expect(
        newCookies.some((c: string) => c.startsWith('access_token=')),
      ).toBe(true);
    });

    it('should return a new access token with Seller User', async () => {
      const user = {
        email: userSeller.email,
        password: sellerPassword,
      };

      const loginResponse: any = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', API_KEY)
        .send(user);

      const cookies = loginResponse.headers['set-cookie'] as string[];

      const data: any = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('x-api-key', API_KEY)
        .set('Cookie', cookies)
        .send();
      const { body, statusCode } = data;
      expect(statusCode).toBe(200);
      expect(body.message).toBe('Token refreshed successfully');

      const newCookies = data.headers['set-cookie'];
      expect(newCookies).toBeDefined();
      expect(
        newCookies.some((c: string) => c.startsWith('access_token=')),
      ).toBe(true);
    });

    it('should return a new access token with Customer User', async () => {
      const user = {
        email: userCustomer.email,
        password: customerPassword,
      };

      const loginResponse: any = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', API_KEY)
        .send(user);

      const cookies = loginResponse.headers['set-cookie'] as string[];

      const data: any = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('x-api-key', API_KEY)
        .set('Cookie', cookies)
        .send();
      const { body, statusCode } = data;
      expect(statusCode).toBe(200);
      expect(body.message).toBe('Token refreshed successfully');

      const newCookies = data.headers['set-cookie'];
      expect(newCookies).toBeDefined();
      expect(
        newCookies.some((c: string) => c.startsWith('access_token=')),
      ).toBe(true);
    });

    it('should return 401 if refresh token is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('x-api-key', API_KEY)
        .set('Cookie', ['refresh_token=invalid_token'])
        .send();
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message');
    });

    it('should return 401 if api key is missing', async () => {
      const data: any = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send();
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('should return 401 if api key is invalid', async () => {
      const data: any = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('x-api-key', 'invalid-api-key')
        .send();
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDataSource();
  });
});
