/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

/* Entity */
import { User } from '@user/entities/user.entity';

/* DTO's */
import { CreateUserDto } from '@user/dto/create-user.dto';

/* Enums */
import { UserRoleEnum } from '@commons/enums/user-role.enum';

/* Faker */
import { createUser, generateUser, generateManyUsers } from '@faker/user.faker';

export const adminPassword = 'john123';

export const seedNewAdminUser = async (): Promise<CreateUserDto> => ({
  firstname: 'John',
  lastname: 'Doe',
  email: 'johndoe@email.com',
  password: await bcrypt.hash(adminPassword, 10),
  phoneNumber: '555-55-55',
  role: UserRoleEnum.ADMIN,
  department: faker.location.state(),
  city: faker.location.city(),
  address: faker.location.streetAddress(),
  neighborhood: faker.location.county(),
});

export const sellerPassword = 'jane123';

export const seedNewSellerUser = async (): Promise<CreateUserDto> => ({
  firstname: 'Jane',
  lastname: 'Doe',
  email: 'janedoe@email.com',
  password: await bcrypt.hash(sellerPassword, 10),
  phoneNumber: '555-55-55',
  role: UserRoleEnum.SELLER,
  department: faker.location.state(),
  city: faker.location.city(),
  address: faker.location.streetAddress(),
  neighborhood: faker.location.county(),
});

export const customerPassword = 'jane123';

export const seedNewCustomerUser = async (): Promise<CreateUserDto> => ({
  firstname: 'Jimmy',
  lastname: 'Doe',
  email: 'jimmydoe@email.com',
  password: await bcrypt.hash(customerPassword, 10),
  phoneNumber: '555-55-55',
  role: UserRoleEnum.CUSTOMER,
  department: faker.location.state(),
  city: faker.location.city(),
  address: faker.location.streetAddress(),
  neighborhood: faker.location.county(),
});

export const seedNewUser = createUser();

export const seedUser: User = generateUser();

export const seedUsers: User[] = generateManyUsers(10);
