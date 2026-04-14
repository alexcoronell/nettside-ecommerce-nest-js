import { faker } from '@faker-js/faker';

/* Entity */
import { ShippingCompany } from '@shipping_company/entities/shipping-company.entity';

/* DTO */
import { CreateShippingCompanyDto } from '@shipping_company/dto/create-shipping-company.dto';

/* Fakers */
import { generateBaseEntity } from '@faker/base.faker';
import { generateUser } from './user.faker';

export const createShippingCompany = (): CreateShippingCompanyDto => ({
  name: faker.company.name(),
  contactName: faker.person.fullName(),
  phoneNumber: faker.phone.number({ style: 'international' }),
  email: faker.internet.email(),
});

export const generateNewShippingCompanies = (
  size: number = 1,
): CreateShippingCompanyDto[] => {
  const newShippingCompanies: CreateShippingCompanyDto[] = [];
  for (let i = 0; i < size; i++) {
    newShippingCompanies.push(createShippingCompany());
  }
  return newShippingCompanies;
};

export const generateShippingCompany = (id: number = 1): ShippingCompany => ({
  ...generateBaseEntity(id),
  ...createShippingCompany(),
  ...generateRelations(),
  createdBy: generateUser(),
  updatedBy: generateUser(),
  deletedBy: null,
});

export const generateManyShippingCompanies = (
  size: number,
): ShippingCompany[] => {
  const shippingCompanies: ShippingCompany[] = [];
  for (let i = 0; i < size; i++) {
    shippingCompanies.push(generateShippingCompany(i + 1));
  }
  return shippingCompanies;
};

const generateRelations = () => ({
  sales: [],
  shipments: [],
});
