import { faker } from '@faker-js/faker/.';

/* Entity */
import { Sale } from '@sale/entities/sale.entity';

/* DTO */
import { CreateSaleDto } from '@sale/dto/create-sale.dto';

/* Enums */
import { SaleStatusEnum } from '@commons/enums/sale-status.enum';

/* Fakers */
import { generatePaymentMethod } from './paymentMethod.faker';
import { generateUser } from './user.faker';

export const createSale = (): CreateSaleDto => ({
  totalAmount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
  shippingAddress: faker.location.streetAddress(),
  status: faker.helpers.arrayElement(
    Object.values(SaleStatusEnum),
  ) as SaleStatusEnum,
  paymentMethod: faker.number.int({ min: 1, max: 10 }),
});

export const generateSale = (id: number = 1): Sale => ({
  ...createSale(),
  ...generateRelations(),
  id,
  user: generateUser(),
  paymentMethod: generatePaymentMethod(),
  saleDate: faker.date.recent(),
  status: faker.helpers.arrayElement(
    Object.values(SaleStatusEnum),
  ) as SaleStatusEnum,
  cancelledAt: null,
  cancelledBy: null,
  isCancelled: false,
});

export const generateNewSales = (size: number): CreateSaleDto[] => {
  const newSales: CreateSaleDto[] = [];
  for (let i = 0; i < size; i++) {
    newSales.push(createSale());
  }
  return newSales;
};

export const generateManySales = (size: number): Sale[] => {
  const sales: Sale[] = [];
  for (let i = 0; i < size; i++) {
    sales.push(generateSale(i + 1));
  }
  return sales;
};

const generateRelations = () => ({
  details: [],
  shipments: [],
});
