/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import config from '@config/index';
import { AuthModule } from '@auth/auth.module';
import { UserModule } from '@user/user.module';
import {
  initDataSource,
  cleanDB,
  closeDataSource,
  dataSource,
} from '../utils/seed';
import { seedNewAdminUser } from '../utils/user.seed';

describe('Auth HttpOnly Cookie Strategy (e2e)', () => {
  let app: INestApplication;
  let userAdmin: any;
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
        AuthModule,
        UserModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  beforeEach(async () => {
    await cleanDB();
    userAdmin = await seedNewAdminUser();
    const repo = app.get('UserRepository');
    await repo.save(userAdmin);
  });

  afterAll(async () => {
    await app.close();
    await closeDataSource();
  });

  it('POST /auth/login should set HttpOnly cookies', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-api-key', API_KEY)
      .send({
        email: userAdmin.email,
        password: 'john123',
      });

    expect(response.status).toBe(200);

    // Check for cookies
    const cookies = response.get('Set-Cookie');
    expect(cookies).toBeDefined();

    if (!cookies) {
      throw new Error('Cookies not found');
    }

    const accessTokenCookie = cookies.find((c) =>
      c.startsWith('access_token='),
    );
    const refreshTokenCookie = cookies.find((c) =>
      c.startsWith('refresh_token='),
    );

    expect(accessTokenCookie).toContain('HttpOnly');
    expect(refreshTokenCookie).toContain('HttpOnly');

    // Body should NOT contain tokens
    expect(response.body).not.toHaveProperty('access_token');
    expect(response.body).not.toHaveProperty('refresh_token');
    expect(response.body.data.email).toBe(userAdmin.email);
  });

  it('GET /auth/me should work with access_token cookie', async () => {
    // 1. Login to get cookies
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-api-key', API_KEY)
      .send({
        email: userAdmin.email,
        password: 'john123',
      });

    const authCookies = loginResponse.get('Set-Cookie');
    if (!authCookies) throw new Error('Auth cookies not found');

    // 2. Call /auth/me using the cookies
    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('x-api-key', API_KEY)
      .set('Cookie', authCookies)
      .send();

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.user).toBe(userAdmin.id);
  });

  it('POST /auth/refresh should work with refresh_token cookie', async () => {
    // 1. Login to get cookies
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-api-key', API_KEY)
      .send({
        email: userAdmin.email,
        password: 'john123',
      });

    const authCookies = loginResponse.get('Set-Cookie');
    if (!authCookies) throw new Error('Auth cookies not found');

    // 2. Call /auth/refresh using the cookies
    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('x-api-key', API_KEY)
      .set('Cookie', authCookies)
      .send();

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.message).toBe('Token refreshed successfully');

    // Should have new access_token cookie
    const newCookies = refreshResponse.get('Set-Cookie');
    if (!newCookies) throw new Error('New cookies not found');
    expect(newCookies.find((c) => c.startsWith('access_token='))).toBeDefined();
  });
});
