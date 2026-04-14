import { faker } from '@faker-js/faker';

/* Entity */
import { PaymentMethod } from '@payment_method/entities/payment-method.entity';

/* DTO */
import { CreatePaymentMethodDto } from '@payment_method/dto/create-payment-method.dto';

/* Fakers */
import { generateBaseEntity } from '@faker/base.faker';
import { generateUser } from './user.faker';

export const createPaymentMethod = (): CreatePaymentMethodDto => ({
  name: faker.word.words(2),
});

export const generateNewPaymentMethods = (
  size = 1,
): CreatePaymentMethodDto[] => {
  const newPaymentMethods: CreatePaymentMethodDto[] = [];
  for (let i = 0; i < size; i++) {
    newPaymentMethods.push(createPaymentMethod());
  }
  return newPaymentMethods;
};

export const generatePaymentMethod = (id: number = 1): PaymentMethod => ({
  ...generateBaseEntity(id),
  ...createPaymentMethod(),
  ...generateRelations(),
  id,
  createdBy: generateUser(),
  updatedBy: generateUser(),
  deletedBy: null,
});

export const generateManyPaymentMethods = (size: number): PaymentMethod[] => {
  const paymentMethods: PaymentMethod[] = [];
  for (let i = 0; i < size; i++) {
    paymentMethods.push(generatePaymentMethod(i + 1));
  }
  return paymentMethods;
};

const generateRelations = () => ({
  sales: [],
});
