import { faker } from '@faker-js/faker';

/* Entity */
import { Product } from '@product/entities/product.entity';

/* DTO */
import { CreateProductDto } from '@product/dto/create-product.dto';

/* Fakers */
import { generateBaseEntity } from '@faker/base.faker';
import { generateBrand } from './brand.faker';
import { generateCategory } from './category.faker';
import { generateUser } from './user.faker';
import { generateSubcategory } from './subcategory.faker';

export const createProduct = (
  category?: number,
  subcategory?: number,
  brand?: number,
): CreateProductDto => {
  const name =
    faker.commerce.productName() + faker.number.int({ min: 100, max: 200 });
  const description = faker.commerce.productDescription();
  const price = parseInt(faker.commerce.price());
  const stock = faker.number.int({ min: 0, max: 1000 });
  return {
    name,
    description,
    price,
    stock,
    category: category || faker.number.int({ min: 1, max: 100 }),
    subcategory: subcategory || faker.number.int({ min: 1, max: 100 }),
    brand: brand || faker.number.int({ min: 1, max: 100 }),
  };
};

export const generateNewProducts = (
  size: number = 1,
  category?: number,
  subcategory?: number,
  brand?: number,
): CreateProductDto[] => {
  const newProducts: CreateProductDto[] = [];
  for (let i = 0; i < size; i++) {
    newProducts.push(createProduct(category, subcategory, brand));
  }
  return newProducts;
};

export const generateProduct = (id: number = 1): Product => {
  const name =
    faker.commerce.productName() + faker.number.int({ min: 100, max: 200 });
  const description = faker.commerce.productDescription();
  const price = parseInt(faker.commerce.price());
  const stock = faker.number.int({ min: 0, max: 1000 });
  const slug = faker.helpers.slugify(name).toLowerCase();
  return {
    ...generateBaseEntity(id),
    name,
    slug,
    description,
    price,
    stock,
    id,
    brand: generateBrand(),
    category: generateCategory(),
    subcategory: generateSubcategory(),
    createdBy: generateUser(),
    updatedBy: generateUser(),
    deletedBy: null,
    images: [],
    productSuppliers: [],
    tags: [],
    productDiscounts: [],
    wishlists: [],
    saleDetails: [],
    purchaseDetails: [],
  };
};

export const generateManyProducts = (size: number): Product[] => {
  const products: Product[] = [];
  for (let i = 0; i < size; i++) {
    products.push(generateProduct(i + 1));
  }
  return products;
};
