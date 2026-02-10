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
import { BrandModule } from '@brand/brand.module';
import { CategoryModule } from '@category/category.module';
import { SubcategoryModule } from '@subcategory/subcategory.module';
import { ProductModule } from '@product/product.module';
import { SaleModule } from '@sale/sale.module';
import { SaleDetailModule } from '@sale_detail/sale-detail.module';
import { UserModule } from '@user/user.module';

/* Entities */
import { Brand } from '@brand/entities/brand.entity';
import { Category } from '@category/entities/category.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';
import { Product } from '@product/entities/product.entity';
import { Sale } from '@sale/entities/sale.entity';

/* Interceptors */
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

import { ERROR_MESSAGES, HTTP_STATUS } from '../../src/commons/constants';

/* Seed */
import { initDataSource, cleanDB, closeDataSource } from '../utils/seed';

/* DataSource */
import { dataSource } from '../utils/seed';

/* Faker */
import { createBrand } from '@faker/brand.faker';
import { createCategory } from '@faker/category.faker';
import { createSubcategory } from '@faker/subcategory.faker';
import { generateNewProducts } from '@faker/product.faker';
import { generateNewPaymentMethods } from '@faker/paymentMethod.faker';
import { createSaleDetail } from '@faker/saleDetail.faker';
import { CreateSaleDetailDto } from '@sale_detail/dto/create-sale-detail.dto';

/* Login Users */
import { loginAdmin } from '../utils/login-admin';
import { loginSeller } from '../utils/login-seller';
import { loginCustomer } from '../utils/login-customer';

/* ApiKey */
const API_KEY = process.env.API_KEY || 'api-e2e-key';

const PATH = '/sale-detail';

describe('SaleDetailController (e2e) [POST]', () => {
  let app: INestApplication<App>;
  let repoBrand: any = undefined;
  let repoCategory: any = undefined;
  let repoSubcategory: any = undefined;
  let repoProduct: any = undefined;
  let repoSale: any = undefined;
  let repoPaymentMethod: any = undefined;
  let repoUser: any = undefined;
  let adminAccessToken: string;
  let sellerAccessToken: string;
  let customerAccessToken: string;
  let brand: Brand;
  let category: Category;
  let subcategory: Subcategory;
  let sale: Sale;
  let products: Product[] = [];

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
        CategoryModule,
        SubcategoryModule,
        ProductModule,
        SaleModule,
        SaleDetailModule,
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
    await app.init();
    repoBrand = app.get('BrandRepository');
    repoCategory = app.get('CategoryRepository');
    repoSubcategory = app.get('SubcategoryRepository');
    repoProduct = app.get('ProductRepository');
    repoSale = app.get('SaleRepository');
    repoPaymentMethod = app.get('PaymentMethodRepository');
    repoUser = app.get('UserRepository');
  });

  beforeEach(async () => {
    await cleanDB();

    const resLoginAdmin = await loginAdmin(app, repoUser);
    adminAccessToken = resLoginAdmin.access_token;
    const resLoginSeller = await loginSeller(app, repoUser);
    sellerAccessToken = resLoginSeller.access_token;
    const resLoginCustomer = await loginCustomer(app, repoUser);
    customerAccessToken = resLoginCustomer.access_token;

    const newBrand = createBrand();
    brand = await repoBrand.save(newBrand);

    const newCategory = createCategory();
    category = await repoCategory.save(newCategory);

    const newSubcategories = createSubcategory(category.id);
    subcategory = await repoSubcategory.save(newSubcategories);

    const newProducts = generateNewProducts(
      3,
      category.id,
      subcategory.id,
      brand.id,
    );
    products = await repoProduct.save(newProducts);

    const newPaymentMethods = generateNewPaymentMethods(5);
    const paymentMethods = await repoPaymentMethod.save(newPaymentMethods);
    const paymentMethod = paymentMethods[0];

    const saleDto = {
      totalAmount: 100,
      shippingAddress: 'Test Address 123',
      paymentMethod: paymentMethod.id,
    };
    sale = await repoSale.save(saleDto);
  });

  describe('POST SaleDetail', () => {
    it('/ should create sale details, return 201 with customer user', async () => {
      const dto: CreateSaleDetailDto[] = products.map((product) => ({
        ...createSaleDetail(),
        sale: sale.id,
        product: product.id,
      }));
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(dto);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.CREATED);
      expect(data.length).toBeGreaterThan(0);
    });

    it('/ should create sale details, return 201 with admin user', async () => {
      const dto: CreateSaleDetailDto[] = products.map((product) => ({
        ...createSaleDetail(),
        sale: sale.id,
        product: product.id,
      }));
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(dto);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.CREATED);
      expect(data.length).toBeGreaterThan(0);
    });

    it('/ should create sale details, return 201 with seller user', async () => {
      const dto: CreateSaleDetailDto[] = products.map((product) => ({
        ...createSaleDetail(),
        sale: sale.id,
        product: product.id,
      }));
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .set('Authorization', `Bearer ${sellerAccessToken}`)
        .send(dto);
      const { statusCode, data } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.CREATED);
      expect(data.length).toBeGreaterThan(0);
    });

    it('/ should return 401 without user', async () => {
      const dto: CreateSaleDetailDto[] = products.map((product) => ({
        ...createSaleDetail(),
        sale: sale.id,
        product: product.id,
      }));
      const res = await request(app.getHttpServer())
        .post(PATH)
        .set('x-api-key', API_KEY)
        .send(dto);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('/ should not create sale details, return 401 with invalid api key', async () => {
      const dto: CreateSaleDetailDto[] = products.map((product) => ({
        ...createSaleDetail(),
        sale: sale.id,
        product: product.id,
      }));
      const res = await request(app.getHttpServer())
        .post(`${PATH}`)
        .set('x-api-key', 'invalid-api-key')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(dto);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });

    it('/ should not create sale details, return 401 if api key is missing', async () => {
      const dto: CreateSaleDetailDto[] = products.map((product) => ({
        ...createSaleDetail(),
        sale: sale.id,
        product: product.id,
      }));
      const res = await request(app.getHttpServer())
        .post(`${PATH}`)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send(dto);
      const { statusCode, message } = res.body;
      expect(statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(message).toBe(ERROR_MESSAGES.INVALID_API_KEY);
    });
  });

  afterAll(async () => {
    await app.close();
    await closeDataSource();
  });
});
