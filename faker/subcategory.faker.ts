import { faker } from '@faker-js/faker';

/* eslint-disable @typescript-eslint/no-unused-vars */

/* Entity */
import { Subcategory } from '@subcategory/entities/subcategory.entity';

/* DTO */
import { CreateSubcategoryDto } from '@subcategory/dto/create-subcategory.dto';

/* Fakers */
import { generateBaseEntity } from '@faker/base.faker';
import { generateUser } from './user.faker';
import { generateCategory } from './category.faker';

import { createSlug } from '@commons/utils/create-slug.util';

export const createSubcategory = (
  categoryId: number = 1,
  name: string | null = null,
): CreateSubcategoryDto => {
  const category = categoryId || faker.number.int({ min: 1, max: 100 });
  const fakeNumber = faker.number.int({ min: 1, max: 100 });
  const tempName = `${faker.lorem.words(3)}-${fakeNumber}`;
  return {
    name: name || tempName,
    category,
  };
};

/**
 * Creates a subcategory with slug for e2e tests and seeders.
 * This is needed because the database requires slug but CreateSubcategoryDto doesn't include it.
 */
export const createSubcategoryWithSlug = (
  categoryId: number = 1,
  name: string | null = null,
): Partial<Subcategory> => {
  const category = categoryId || faker.number.int({ min: 1, max: 100 });
  const fakeNumber = faker.number.int({ min: 1, max: 100 });
  const tempName = name || `${faker.lorem.words(3)}-${fakeNumber}`;
  return {
    name: tempName,
    slug: createSlug(tempName),
    category: generateCategory(),
  };
};

export const generateNewSubcategories = (
  size: number = 1,
  category = 1,
): Partial<Subcategory>[] => {
  const newSubcategories: Partial<Subcategory>[] = [];
  for (let i = 0; i < size; i++) {
    const categoryEntity = generateCategory();
    const fakeNumber = faker.number.int({ min: 1, max: 100 });
    const tempName = `${faker.lorem.words(3)}-${fakeNumber}`;
    newSubcategories.push({
      name: tempName,
      slug: createSlug(tempName),
      category: categoryEntity,
      createdBy: generateUser(),
      updatedBy: generateUser(),
    });
  }
  return newSubcategories;
};

export const generateSubcategory = (
  id: number = 1,
  _categoryId: number = 1,
  name: string | null = null,
): Subcategory => {
  const fakeNumber = faker.number.int({ min: 1, max: 100 });
  const tempName = name || `${faker.lorem.words(3)}-${fakeNumber}`;
  const slug = createSlug(tempName);
  return {
    ...generateBaseEntity(id),
    name: tempName,
    slug,
    id,
    category: generateCategory(),
    createdBy: generateUser(),
    updatedBy: generateUser(),
    deletedBy: null,
    ...generateRelations(),
  };
};

export const generateManyNewSubcategories = (
  size: number,
  categoryId: number = 1,
): CreateSubcategoryDto[] => {
  const subcategories: CreateSubcategoryDto[] = [];
  for (let i = 0; i < size; i++) {
    subcategories.push(createSubcategory(categoryId));
  }
  return subcategories;
};

export const generateManySubcategories = (
  size: number,
  categoryId: number = 1,
  name: string | null = null,
): Subcategory[] => {
  const categories: Subcategory[] = [];
  for (let i = 0; i < size; i++) {
    const finalName = i === 0 && name ? name : faker.lorem.word(1);
    categories.push(generateSubcategory(i + 1, categoryId, finalName));
  }
  return categories;
};

const generateRelations = () => ({
  products: [],
});
