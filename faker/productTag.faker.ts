import { faker } from '@faker-js/faker';

/* Entity */
import { ProductTag } from 'src/product-tag/entities/product-tag.entity';

/* DTO */
import { CreateProductTagDto } from 'src/product-tag/dto/create-product-tag.dto';

/* Fakers */
import { generateProduct } from './product.faker';
import { generateTag } from './tag.faker';
import { generateUser } from './user.faker';

export const createProductTag = (): CreateProductTagDto => ({
  product: faker.number.int({ min: 1, max: 100 }),
  tag: faker.number.int({ min: 1, max: 100 }),
});

export const generateProductTag = (): ProductTag => {
  const product = generateProduct();
  const tag = generateTag();
  const createdBy = generateUser();

  const productTag: ProductTag = {
    productId: product.id,
    tagId: tag.id,
    product,
    tag,
    createdBy,
    createdAt: faker.date.anytime(),
  };
  return productTag;
};

export const generateManyProductTags = (size: number): ProductTag[] => {
  const tags: ProductTag[] = [];
  for (let i = 0; i < size; i++) {
    tags.push(generateProductTag());
  }
  return tags;
};
