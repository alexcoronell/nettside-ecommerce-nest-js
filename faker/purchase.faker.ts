import { faker } from '@faker-js/faker';

/* Entity */
import { Purchase } from '@purchase/entities/purchase.entity';

/* DTO */
import { CreatePurchaseDto } from '@purchase/dto/create-purchase.dto';

/* Fakers */
import { generateBaseEntity } from '@faker/base.faker';
import { generateSupplier } from './supplier.faker';
import { generateUser } from './user.faker';

export const createPurchase = (): CreatePurchaseDto => ({
  purchaseDate: faker.date.past(),
  totalAmount: parseFloat(faker.commerce.price()),
  supplier: faker.number.int({ min: 1, max: 100 }),
});

export const generateNewPurchases = (size: number = 1): CreatePurchaseDto[] => {
  const newPurchases: CreatePurchaseDto[] = [];
  for (let i = 0; i < size; i++) {
    newPurchases.push(createPurchase());
  }
  return newPurchases;
};

export const generatePurchase = (id: number = 1): Purchase => ({
  ...generateBaseEntity(id),
  ...createPurchase(),
  id,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
  isDeleted: false,
  deletedBy: null,
  supplier: generateSupplier(),
  createdBy: generateUser(),
  updatedBy: generateUser(),
  purchaseDetails: [],
});

export const generateManyPurchases = (size: number): Purchase[] => {
  const purchases: Purchase[] = [];
  for (let i = 0; i < size; i++) {
    purchases.push(generatePurchase(i + 1));
  }
  return purchases;
};
