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
import { SaleModule } from '@sale/sale.module';
import { ShippingCompanyModule } from '@shipping_company/shipping-company.module';
import { UserModule } from '@user/user.module';
import { PaymentMethodModule } from '@payment_method/payment-method.module';

/* Entities */
import { Sale } from '@sale/entities/sale.entity';
import { ShippingCompany } from '@shipping_company/entities/shipping-company.entity';
import { Shipment } from '@shipment/entities/shipment.entity';
import { PaymentMethod } from '@payment_method/entities/payment-method.entity';

/* DTOs */
import { UpdateShipmentDto } from '@shipment/dto/update-shipment.dto';
import { ShipmentStatusEnum } from '@commons/enums/shipment-status.enum';

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

import {
  ERROR_MESSAGES,
  ERRORS,
  HTTP_STATUS,
} from '../../src/commons/constants';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* Faker */
import { createSale } from '@faker/sale.faker';
import { createShippingCompany } from '@faker/shippingCompany.faker';
import { createShipment } from '@faker/shipment.faker';
import { createPaymentMethod } from '@faker/paymentMethod.faker';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/shipment';
const ID = 1;

describe('ShipmentController (e2e) [PATCH]', () => {
  let app: INestApplication<App>;
  let repo: any = undefined;
  let repoSale: any = undefined;
  let repoShippingCompany: any = undefined;
  let repoUser: any = undefined;
  let repoPaymentMethod: any = undefined;
  let adminAccessToken: string;
  let sellerAccessToken: string;
  let customerAccessToken: string;
  let sale: Sale;
  let shippingCompany: ShippingCompany;
  let shipment: Shipment;
  let paymentMethod: PaymentMethod;

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
        SaleModule,
        ShippingCompanyModule,
        UserModule,
        PaymentMethodModule,
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
    repo = app.get('ShipmentRepository');
    repoSale = app.get('SaleRepository');
    repoShippingCompany = app.get('ShippingCompanyRepository');
    repoUser = app.get('UserRepository');
    repoPaymentMethod = app.get('PaymentMethodRepository');
  });

  beforeEach(async () => {
    await cleanDB();

    const { adminUser, access_token } = await loginAdmin(app, repoUser);
    adminAccessToken = access_token;
    const resLoginSeller = await loginSeller(app, repoUser);
    sellerAccessToken = resLoginSeller.access_token;
    const resLoginCustomer = await loginCustomer(app, repoUser);
    customerAccessToken = resLoginCustomer.access_token;

    const newPaymentMethod = createPaymentMethod();
    paymentMethod = await repoPaymentMethod.save(newPaymentMethod);

    const newSaleDto = createSale();
    sale = await repoSale.save({
      ...newSaleDto,
      user: adminUser,
      paymentMethod: paymentMethod,
    });

    const newShippingCompany = createShippingCompany();
    shippingCompany = await repoShippingCompany.save(newShippingCompany);

    const newShipment = createShipment(sale.id, shippingCompany.id);
    shipment = await repo.save(newShipment);
  });

  describe('PATCH /shipment/:id', () => {
    it('should update a shipment with admin user', async () => {
      const updatedData: UpdateShipmentDto = {
        status: ShipmentStatusEnum.DELIVERED,
      };
      const res = await request(app.getHttpServer())
        .patch(`${PATH}/${ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.OK);
      expect(data.status).toBe(updatedData.status);
    });

    it('should return 401 with seller user', async () => {
      const updatedData: UpdateShipmentDto = {
        status: ShipmentStatusEnum.DELIVERED,
      };
      const res = await request(app.getHttpServer())
        .patch(`${PATH}/${shipment.id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`)
        .send(updatedData);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('should return 401 with customer user', async () => {
      const updatedData: UpdateShipmentDto = {
        status: ShipmentStatusEnum.DELIVERED,
      };
      const res = await request(app.getHttpServer())
        .patch(`${PATH}/${shipment.id}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(updatedData);
      const { statusCode, error, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.ADMIN_REQUIRED);
      expect(error).toBe(ERRORS.UNAUTHORIZED);
    });

    it('should return 404 when trying to update a non-existent shipment', async () => {
      const NON_EXISTENT_ID = 9999;
      const updatedData: UpdateShipmentDto = {
        status: ShipmentStatusEnum.DELIVERED,
      };
      const res = await request(app.getHttpServer())
        .patch(`${PATH}/${NON_EXISTENT_ID}`)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatedData);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(message).toContain('not found');
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDataSource();
  });
});
