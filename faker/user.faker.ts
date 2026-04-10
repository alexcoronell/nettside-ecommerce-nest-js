import { faker } from '@faker-js/faker';

import { generateBaseEntity } from '@faker/base.faker';

/* Entities */
import { User } from '@user/entities/user.entity';

/* DTO's */
import { CreateUserDto } from '@user/dto/create-user.dto';

/* Enums */
import { UserRoleEnum } from '@commons/enums/user-role.enum';

export const createUser = (): CreateUserDto => ({
  firstname: faker.person.firstName(),
  lastname: faker.person.lastName(),
  email: faker.internet.email().toLowerCase(),
  password: faker.internet.password(),
  phoneNumber: faker.phone.number({ style: 'international' }),
  department: faker.location.state(),
  city: faker.location.city(),
  address: faker.location.streetAddress(),
  neighborhood: faker.location.county(),
});

const auditUser = { id: 1 } as User;

export const generateUser = (id: User['id'] = 1, isDeleted = false): User => ({
  ...generateBaseEntity(id, isDeleted),
  ...createUser(),
  isActive: true,
  id,
  role: faker.helpers.arrayElement(Object.values(UserRoleEnum)),
  createdBy: auditUser,
  updatedBy: auditUser,
  deletedBy: null,
});

export const generateCustomer = (
  id: User['id'] = 1,
  isDeleted = false,
): User => ({
  ...generateBaseEntity(id, isDeleted),
  ...createUser(),
  isActive: true,
  id,
  role: UserRoleEnum.CUSTOMER,
  createdBy: auditUser,
  updatedBy: auditUser,
  deletedBy: null,
});

export const generateManyNewUsers = (size = 1): CreateUserDto[] => {
  const users: CreateUserDto[] = [];
  for (let i = 0; i < size; i++) {
    users.push(createUser());
  }
  return users;
};

export const generateManyUsers = (size: number): User[] => {
  const limit = size ?? 10;
  const users: User[] = [];
  for (let i = 0; i < limit; i++) {
    users.push(generateUser(i + 1));
  }
  return users;
};

export const generateManyCustomers = (size: number): User[] => {
  const limit = size ?? 10;
  const users: User[] = [];
  for (let i = 0; i < limit; i++) {
    users.push(generateCustomer(i + 1));
  }
  return users;
};

export const generateManyDeletedUsers = (size: number): User[] => {
  const users: User[] = [];
  for (let i = 0; i < size; i++) {
    users.push(generateUser(i, true));
  }
  return users;
};

export const generateUserRelations = () => ({
  createdBrands: [],
  updatedBrands: [],
  deletedBrands: [],
  createdCategories: [],
  updatedCategories: [],
  deletedCategories: [],
  createdDiscounts: [],
  updatedDiscounts: [],
  deletedDiscounts: [],
  createdPaymentMethods: [],
  updatedPaymentMethods: [],
  deletedPaymentMethods: [],
  createdProducts: [],
  updatedProducts: [],
  deletedProducts: [],
  createdProductDiscounts: [],
  uploadedProductImages: [],
  createdProductSuppliers: [],
  updatedProductSuppliers: [],
  deletedProductSuppliers: [],
  createdProductsTags: [],
  createdPurchases: [],
  updatedPurchases: [],
  deletedPurchases: [],
  cancelledSales: [],
  createdShipments: [],
  updatedShipments: [],
  deletedShipments: [],
  createdShippingCompanies: [],
  updatedShippingCompanies: [],
  deletedShippingCompanies: [],
  createdStoreDetail: [],
  updatedStoreDetail: [],
  createdSubcategories: [],
  updatedSubcategories: [],
  deletedSubcategories: [],
  createdSuppliers: [],
  updatedSuppliers: [],
  deletedSuppliers: [],
  createdTags: [],
  updatedTags: [],
  deletedTags: [],
  createdUsers: [],
  updatedUsers: [],
  deletedUsers: [],
  wishlists: [],
});
