import { faker } from '@faker-js/faker';

/* Entity */
import { StoreDetail } from '@store_detail/entities/store-detail.entity';

/* Fakers */
import { generateUser } from './user.faker';

export const generateStoreDetail = (): StoreDetail => ({
  id: 1,
  name: faker.company.name(),
  country: faker.location.country(),
  state: faker.location.state(),
  city: faker.location.city(),
  neighborhood: faker.location.county(),
  address: faker.location.streetAddress(),
  phone: faker.phone.number({ style: 'international' }),
  email: faker.internet.email(),
  legalInformation: faker.lorem.paragraphs(2),
  createdAt: faker.date.anytime(),
  updatedAt: faker.date.anytime(),
  createdBy: generateUser(),
  updatedBy: generateUser(),
});
