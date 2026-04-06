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
import { seedNewSellerUser, sellerPassword } from '../utils/user.seed';

describe('AuthController (e2e) SELLER USER', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let userSeller: any = undefined;

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

    userSeller = await seedNewSellerUser();
    await repo.save(userSeller);
  });

  const API_KEY = process.env.API_KEY || 'api-e2e-key';

  describe('POST /auth/login  Auth Login Seller Users', () => {
    it('should return an access token with Seller User', async () => {
      const user = {
        email: userSeller.email,
        password: sellerPassword,
      };

      const data: any = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', API_KEY)
        .send(user);
      const { body, statusCode } = data;
      expect(statusCode).toBe(200);

      const cookies = data.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.startsWith('access_token='))).toBe(
        true,
      );
      expect(cookies.some((c: string) => c.startsWith('refresh_token='))).toBe(
        true,
      );

      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('message');
      expect(body.data.email).toBe(userSeller.email);
    });

    it('should return 401 if user password is incorrect', async () => {
      const user = {
        email: userSeller.email,
        password: 'wrongpassword',
      };

      const data: any = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', API_KEY)
        .send(user);
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Not Allow');
    });

    it('should return 401 if api key is missing', async () => {
      const user = {
        email: userSeller.email,
        password: sellerPassword,
      };

      const data: any = await request(app.getHttpServer())
        .post('/auth/login')
        .send(user);
      const { body, statusCode } = data;
      expect(statusCode).toBe(401);
      expect(body).toHaveProperty('message', 'Invalid API key');
    });

    it('should return 401 if api key is invalid', async () => {
      const user = {
        email: userSeller.email,
        password: sellerPassword,
      };

      const data: any = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-api-key', 'invalid-api-key')
        .send(user);
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
