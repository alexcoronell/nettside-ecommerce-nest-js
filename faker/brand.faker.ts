import { faker } from '@faker-js/faker';

/* Entities */
import { Brand } from '@brand/entities/brand.entity';

/* DTO's */
import { CreateBrandDto } from '@brand/dto/create-brand.dto';

/* Fakers */
import { generateBaseEntity } from '@faker/base.faker';
import { generateUser } from './user.faker';

/* Utils */
import { createSlug } from '@commons/utils/create-slug.util';

export const createBrand = (): CreateBrandDto => {
  const name =
    faker.commerce.productName() + faker.number.int({ min: 100, max: 200 });
  return {
    name,
    slug: createSlug(name),
    logo: faker.image.url(),
  };
};

export const generateNewBrands = (size: number = 1): CreateBrandDto[] => {
  const newBrands: CreateBrandDto[] = [];
  for (let i = 0; i < size; i++) {
    newBrands.push(createBrand());
  }
  return newBrands;
};

export const generateBrand = (id: number = 1): Brand => ({
  ...generateBaseEntity(id),
  ...createBrand(),
  id,
  createdBy: generateUser(),
  updatedBy: generateUser(),
  deletedBy: null,
});

export const generateManyBrands = (size: number): Brand[] => {
  const brands: Brand[] = [];
  for (let i = 0; i < size; i++) {
    brands.push(generateBrand(i + 1));
  }
  return brands;
};
