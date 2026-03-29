import { faker } from '@faker-js/faker';

/* Entity */
import { PurchaseDetail } from '@purchase_detail/entities/purchase-detail.entity';

/* DTO */
import { CreatePurchaseDetailDto } from '@purchase_detail/dto/create-purchase-detail.dto';

/* Fakers */
import { generateBaseEntity } from '@faker/base.faker';
import { generateProduct } from './product.faker';
import { generatePurchase } from './purchase.faker';

export const createPurchaseDetail = (): CreatePurchaseDetailDto => {
  return {
    quantity: faker.number.int({ min: 1, max: 100 }),
    unitPrice: parseFloat(faker.commerce.price()),
    subtotal: parseFloat(faker.commerce.price()),
    product: faker.number.int(),
    purchase: faker.number.int(),
  };
};

export const generateNewPurchaseDetails = (size = 1) => {
  const newPurchaseDetails: CreatePurchaseDetailDto[] = [];
  for (let i = 0; i < size; i++) {
    newPurchaseDetails.push(createPurchaseDetail());
  }
  return newPurchaseDetails;
};

export const generatePurchaseDetail = (id: number = 1): PurchaseDetail => ({
  ...generateBaseEntity(id),
  ...createPurchaseDetail(),
  id,
  product: generateProduct(),
  purchase: generatePurchase(),
});

export const generateManyPurchaseDetails = (size: number): PurchaseDetail[] => {
  const purchaseDetails: PurchaseDetail[] = [];
  for (let i = 0; i < size; i++) {
    purchaseDetails.push(generatePurchaseDetail(i + 1));
  }
  return purchaseDetails;
};
