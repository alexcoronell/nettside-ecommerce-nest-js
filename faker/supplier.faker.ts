import { faker } from '@faker-js/faker';

/* Entity */
import { Supplier } from '@supplier/entities/supplier.entity';

/* DTO */
import { CreateSupplierDto } from '@supplier/dto/create-supplier.dto';

/* Fakers */
import { generateBaseEntity } from '@faker/base.faker';
import { generateUser } from './user.faker';

export const createSupplier = (): CreateSupplierDto => ({
  name: faker.company.name(),
  contactName: faker.person.fullName(),
  phoneNumber: faker.phone.number({ style: 'international' }),
  email: faker.internet.email(),
  website: faker.internet.url(),
  state: faker.location.state(),
  county: faker.location.county(),
  city: faker.location.city(),
  streetAddress: faker.location.streetAddress(),
  postalCode: faker.location.zipCode(),
  notes: faker.lorem.paragraph(),
});

export const generateNewSuppliers = (size: number = 1): CreateSupplierDto[] => {
  const newSuppliers: CreateSupplierDto[] = [];
  for (let i = 0; i < size; i++) {
    newSuppliers.push(createSupplier());
  }
  return newSuppliers;
};

export const generateSupplier = (id: number = 1): Supplier => ({
  ...generateBaseEntity(id),
  ...createSupplier(),
  createdBy: generateUser(),
  updatedBy: generateUser(),
  deletedBy: null,
});

export const generateManySuppliers = (size: number): Supplier[] => {
  const suppliers: Supplier[] = [];
  for (let i = 0; i < size; i++) {
    suppliers.push(generateSupplier(i + 1));
  }
  return suppliers;
};
