import { faker } from '@faker-js/faker';

import { BaseEntity } from '@commons/entities/baseEntity';

const generateBaseEntity = (
  id: BaseEntity['id'],
  isDeleted = false,
): BaseEntity => ({
  id,
  createdAt: faker.date.anytime(),
  updatedAt: faker.date.anytime(),
  deletedAt: isDeleted ? faker.date.anytime() : null,
  isDeleted,
});

export { generateBaseEntity };
