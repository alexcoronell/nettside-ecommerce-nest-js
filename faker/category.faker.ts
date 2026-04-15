import { faker } from '@faker-js/faker';

/* Entity */
import { Category } from '@category/entities/category.entity';

/* DTO */
import { CreateCategoryDto } from '@category/dto/create-category.dto';

/* Fakers */
import { generateBaseEntity } from '@faker/base.faker';
import { generateUser } from './user.faker';

export const createCategory = (): CreateCategoryDto => {
  const name =
    faker.commerce.productName() + faker.number.int({ min: 1000, max: 2000 });
  return {
    name,
    // NOTE: slug is NOT included - it is auto-generated from name
  };
};

export const generateNewCategories = (
  size: number = 1,
): CreateCategoryDto[] => {
  const newCategories: CreateCategoryDto[] = [];
  for (let i = 0; i < size; i++) {
    newCategories.push(createCategory());
  }
  return newCategories;
};

export const generateCategory = (id: number = 1): Category => ({
  ...generateBaseEntity(id),
  id,
  name: `Category ${id}`,
  slug: `category-${id}`,
  createdBy: generateUser(),
  updatedBy: generateUser(),
  deletedBy: null,
  ...generateRelations(),
});

export const generateManyNewCategories = (
  size: number,
): CreateCategoryDto[] => {
  const categories: CreateCategoryDto[] = [];
  for (let i = 0; i < size; i++) {
    categories.push(createCategory());
  }
  return categories;
};

export const generateManyCategories = (size: number): Category[] => {
  const categories: Category[] = [];
  for (let i = 0; i < size; i++) {
    categories.push(generateCategory(i + 1));
  }
  return categories;
};

const generateRelations = () => ({
  subcategories: [],
  products: [],
});
