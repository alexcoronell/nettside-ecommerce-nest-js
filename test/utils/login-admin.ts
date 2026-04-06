/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';

import { seedNewAdminUser, adminPassword } from './user.seed';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

async function loginAdmin(app: INestApplication<App>, repo: any) {
  const adminUser = await repo.save(await seedNewAdminUser());

  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .set('x-api-key', API_KEY)
    .send({
      email: adminUser?.email,
      password: adminPassword,
    });

  const setCookieHeader = login.headers['set-cookie'] as unknown as
    | string[]
    | undefined;
  const access_token =
    setCookieHeader
      ?.find((c: string) => c.startsWith('access_token='))
      ?.split(';')[0]
      ?.replace('access_token=', '') || '';

  const cookies = setCookieHeader || [];

  return { adminUser, access_token, cookies };
}

export { loginAdmin };
