import { faker } from '@faker-js/faker';

/* Entity */
import { ProductImage } from '@product_images/entities/product-image.entity';

/* DTO */
import { CreateProductImageDto } from '@product_images/dto/create-product-image.dto';

/* Fakers */
import { generateBaseEntity } from '@faker/base.faker';
import { generateProduct } from './product.faker';
import { generateUser } from './user.faker';

export const createProductImage = (): CreateProductImageDto => ({
  filePath: faker.image.url(),
  title: faker.lorem.words(3),
  isMain: faker.datatype.boolean(),
  isActive: faker.datatype.boolean(),
  product: faker.number.int({ min: 1, max: 10 }),
});

export const generateNewProductImage = (
  size: number = 1,
): CreateProductImageDto[] => {
  const newBrands: CreateProductImageDto[] = [];
  for (let i = 0; i < size; i++) {
    newBrands.push(createProductImage());
  }
  return newBrands;
};

export const generateProductImage = (id: number = 1): ProductImage => ({
  ...generateBaseEntity(id),
  ...createProductImage(),
  id,
  product: generateProduct(),
  createdBy: generateUser(),
  updatedBy: generateUser(),
});

export const generateManyProductImages = (size: number): ProductImage[] => {
  const images: ProductImage[] = [];
  for (let i = 0; i < size; i++) {
    images.push(generateProductImage(i + 1));
  }
  return images;
};
