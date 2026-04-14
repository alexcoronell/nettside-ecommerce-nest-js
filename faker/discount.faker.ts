import { faker } from '@faker-js/faker';

/* Entity */
import { Discount } from 'src/discount/entities/discount.entity';

/* DTO */
import { CreateDiscountDto } from 'src/discount/dto/create-discount.dto';

/* Fakers */
import { generateBaseEntity } from '@faker/base.faker';
import { generateUser } from './user.faker';

export const createDiscount = (): CreateDiscountDto => {
  const code =
    faker.commerce.productName() + faker.number.int({ min: 100, max: 200 });
  const description = faker.lorem.sentence();
  const type = faker.lorem.word();
  const value = faker.number.float({ min: 10, max: 50, fractionDigits: 2 });
  const startDate = faker.date.anytime();
  const endDate = faker.date.anytime();
  const minimumOrderAmount = faker.number.float({
    min: 10,
    max: 50,
    fractionDigits: 2,
  });
  const usageLimit = faker.number.int({ min: 1, max: 5 });
  const usageLimitPerUser = faker.number.int({ min: 1, max: 5 });
  const active = faker.datatype.boolean();
  return {
    code,
    description,
    type,
    value,
    startDate,
    endDate,
    minimumOrderAmount,
    usageLimit,
    usageLimitPerUser,
    active,
  };
};

export const generateNewDiscounts = (size = 1): CreateDiscountDto[] => {
  const newDiscounts: CreateDiscountDto[] = [];
  for (let i = 0; i < size; i++) {
    newDiscounts.push(createDiscount());
  }
  return newDiscounts;
};

export const generateDiscount = (id: number = 1): Discount => {
  const code =
    faker.commerce.productName() + faker.number.int({ min: 100, max: 200 });
  const description = faker.lorem.sentence();
  const type = faker.lorem.word();
  const value = faker.number.float({ min: 10, max: 50, fractionDigits: 2 });
  const startDate = faker.date.anytime();
  const endDate = faker.date.anytime();
  const minimumOrderAmount = faker.number.float({
    min: 10,
    max: 50,
    fractionDigits: 2,
  });
  const usageLimit = faker.number.int({ min: 1, max: 5 });
  const usageLimitPerUser = faker.number.int({ min: 1, max: 5 });
  const active = faker.datatype.boolean();

  return {
    ...generateBaseEntity(id),
    code,
    description,
    type,
    value,
    startDate,
    endDate,
    minimumOrderAmount,
    usageLimit,
    usageLimitPerUser,
    active,
    id,
    createdBy: generateUser(),
    updatedBy: generateUser(),
    deletedBy: null,
    productDiscounts: [],
  };
};

export const generateManyDiscounts = (size: number): Discount[] => {
  const discounts: Discount[] = [];
  for (let i = 0; i < size; i++) {
    discounts.push(generateDiscount(i + 1));
  }
  return discounts;
};
