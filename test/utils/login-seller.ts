/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';

import { seedNewSellerUser, sellerPassword } from './user.seed';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

async function loginSeller(app: INestApplication<App>, repo: any) {
  const sellerUser = await repo.save(await seedNewSellerUser());

  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .set('x-api-key', API_KEY)
    .send({
      email: sellerUser?.email,
      password: sellerPassword,
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

  return { sellerUser, access_token, cookies };
}

export { loginSeller };
