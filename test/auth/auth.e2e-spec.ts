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
  seedNewSellerUser,
  seedNewCustomerUser,
} from '../utils/user.seed';

describe('AuthController (e2e)', () => {
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

  describe('POST /auth/login  Auth Login with unknown user', () => {
    it('should return 401 if user is not found', async () => {
      const user = {
        email: 'unknown@example.com',
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
  });

  afterAll(async () => {
    await app.close();
    await closeDataSource();
  });
});
