import { faker } from '@faker-js/faker';

/* Entity */
import { ProductDiscount } from 'src/product-discount/entities/product-discount.entity';

/* DTO */
import { CreateProductDiscountDto } from 'src/product-discount/dto/create-product-discount.dto';

/* Fakers */
import { generateDiscount } from './discount.faker';
import { generateProduct } from './product.faker';
import { generateUser } from './user.faker';

/* Entities */
import { Product } from '@product/entities/product.entity';
import { Discount } from '@discount/entities/discount.entity';
import { User } from '@user/entities/user.entity';

export const createProductDiscount = (
  productId?: number | null,
  discountId?: number | null,
): CreateProductDiscountDto => ({
  product: productId || faker.number.int({ min: 1, max: 100 }),
  discount: discountId || faker.number.int({ min: 1, max: 100 }),
});

export const generateNewProductDiscounts = (
  size: number = 1,
  productId?: number | null,
  discountId?: number | null,
): CreateProductDiscountDto[] => {
  const newProducDiscounts: CreateProductDiscountDto[] = [];
  for (let i = 0; i < size; i++) {
    newProducDiscounts.push(createProductDiscount(productId, discountId));
  }
  return newProducDiscounts;
};

export const generateProductDiscount = (): ProductDiscount => {
  const product = generateProduct();
  const discount = generateDiscount();
  const createdBy = generateUser(1);

  const productDiscount: ProductDiscount = {
    productId: product.id,
    discountId: discount.id,
    product,
    discount,
    createdBy,
    createdAt: faker.date.anytime(),
  };
  return productDiscount;
};

export const generateManyProductDiscounts = (
  size: number,
): ProductDiscount[] => {
  const productsDiscounts: ProductDiscount[] = [];
  for (let i = 0; i < size; i++) {
    productsDiscounts.push(generateProductDiscount());
  }
  return productsDiscounts;
};

export const generateProductDiscountE2E = (
  product: Product,
  discount: Discount,
  user: User,
): ProductDiscount => {
  return {
    productId: product.id,
    discountId: discount.id,
    product,
    discount,
    createdBy: user,
    createdAt: faker.date.anytime(),
  };
};

export const generateManyProductDiscountE2E = (
  size: number,
  product: Product,
  discount: Discount,
  user: User,
) => {
  const productsDiscounts: ProductDiscount[] = [];
  for (let i = 0; i < size; i++) {
    productsDiscounts.push(generateProductDiscountE2E(product, discount, user));
  }
  return productsDiscounts;
};
