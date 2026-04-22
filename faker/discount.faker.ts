import { faker } from '@faker-js/faker';

/* Entity */
import { Discount } from 'src/discount/entities/discount.entity';

/* DTO */
import { CreateDiscountDto } from 'src/discount/dto/create-discount.dto';

/* Fakers */
import { generateBaseEntity } from '@faker/base.faker';
import { generateUser } from './user.faker';

export const createDiscount = (): CreateDiscountDto => {
  const discount: CreateDiscountDto = {
    name:
      faker.commerce.productName() + faker.number.int({ min: 100, max: 200 }),
    description: faker.lorem.sentence() as unknown as string,
    type: faker.lorem.word(),
    value: faker.number.float({ min: 10, max: 50, fractionDigits: 2 }),
    startDate: faker.date.anytime(),
    endDate: faker.date.anytime(),
    minimumOrderAmount: faker.number.float({
      min: 10,
      max: 50,
      fractionDigits: 2,
    }),
    minimumProductsCount: faker.number.int({ min: 1, max: 5 }),
    usageLimit: faker.number.int({ min: 1, max: 5 }),
    usageLimitPerUser: faker.number.int({ min: 1, max: 5 }),
    active: faker.datatype.boolean(),
  };
  return discount;
};

export const generateNewDiscounts = (size = 1): CreateDiscountDto[] => {
  const newDiscounts: CreateDiscountDto[] = [];
  for (let i = 0; i < size; i++) {
    newDiscounts.push(createDiscount());
  }
  return newDiscounts;
};

export const generateDiscount = (id: number = 1): Discount => {
  const discount: Discount = {
    ...generateBaseEntity(id),
    ...createDiscount(),
    createdBy: generateUser(),
    updatedBy: generateUser(),
    deletedBy: null,
    active: true,
  } as Discount;
  return discount;
};

export const generateManyDiscounts = (size: number): Discount[] => {
  const discounts: Discount[] = [];
  for (let i = 0; i < size; i++) {
    discounts.push(generateDiscount(i + 1));
  }
  return discounts;
};
