import { faker } from '@faker-js/faker';

/* Entity */
import { Sale } from '@sale/entities/sale.entity';

/* DTO */
import { CreateSaleDto } from '@sale/dto/create-sale.dto';

/* Enums */
import { SaleStatusEnum } from '@commons/enums/sale-status.enum';

/* Fakers */
import { generatePaymentMethod } from './paymentMethod.faker';
import { generateUser } from './user.faker';

/**
 * Creates a new sale DTO for creation.
 * Note: status is NOT included - it's set internally by the service.
 */
export const createSale = (): CreateSaleDto => ({
  totalAmount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
  shippingAddress: faker.location.streetAddress(),
  paymentMethod: faker.number.int({ min: 1, max: 10 }),
});

/**
 * Generates a Sale entity with all fields for testing.
 */
export const generateSale = (id: number = 1): Sale => {
  const sale = new Sale();
  sale.id = id;
  sale.totalAmount = faker.number.float({
    min: 10,
    max: 1000,
    fractionDigits: 2,
  });
  sale.shippingAddress = faker.location.streetAddress();
  sale.status = faker.helpers.arrayElement(
    Object.values(SaleStatusEnum),
  ) as SaleStatusEnum;
  sale.isCancelled = false;
  sale.cancelledAt = null;
  sale.user = generateUser();
  sale.paymentMethod = generatePaymentMethod();
  sale.saleDate = faker.date.recent();
  return sale;
};

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
