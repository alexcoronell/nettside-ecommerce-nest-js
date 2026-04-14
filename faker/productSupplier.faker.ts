import { faker } from '@faker-js/faker';

/* Entity */
import { ProductSupplier } from '@product_supplier/entities/product-supplier.entity';
/* DTO */
import { CreateProductSupplierDto } from '@product_supplier/dto/create-product-supplier.dto';

/* Fakers */
import { generateBaseEntity } from '@faker/base.faker';
import { generateProduct } from './product.faker';
import { generateSupplier } from './supplier.faker';
import { generateUser } from './user.faker';

/* Entities */
import { Product } from '@product/entities/product.entity';
import { Supplier } from '@supplier/entities/supplier.entity';
import { User } from '@user/entities/user.entity';

export const createProductSupplier = (): CreateProductSupplierDto => ({
  supplierProductCode: faker.string.alphanumeric(10),
  costPrice: parseFloat(faker.commerce.price({ min: 1, max: 1000 })),
  isPrimarySupplier: faker.datatype.boolean(),
  product: faker.number.int(),
  supplier: faker.number.int(),
});

export const generateProductSupplier = (id: number = 1): ProductSupplier => ({
  ...generateBaseEntity(id),
  ...createProductSupplier(),
  id,
  product: generateProduct(),
  supplier: generateSupplier(),
  createdBy: generateUser(),
  updatedBy: generateUser(),
  deletedBy: null,
});

export const generateManyProductSuppliers = (
  size: number,
): ProductSupplier[] => {
  const suppliers: ProductSupplier[] = [];
  for (let i = 0; i < size; i++) {
    suppliers.push(generateProductSupplier(i + 1));
  }
  return suppliers;
};

export const generateProductSupplierE2E = (
  id: number = 1,
  product: Product,
  supplier: Supplier,
  user: User,
): ProductSupplier => {
  return {
    id,
    supplierProductCode: faker.string.alphanumeric(10),
    costPrice: parseFloat(faker.commerce.price({ min: 1, max: 1000 })),
    isPrimarySupplier: faker.datatype.boolean(),
    product,
    supplier,
    createdBy: user,
    updatedBy: user,
    deletedBy: null,
    isDeleted: false,
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
    deletedAt: null,
  };
};

export const generateManyProductSuppliersE2E = (
  size = 1,
  product: Product,
  supplier: Supplier,
  user: User,
) => {
  const productSuppliers: ProductSupplier[] = [];
  for (let i = 0; i < size; i++) {
    productSuppliers.push(
      generateProductSupplierE2E(i + 1, product, supplier, user),
    );
  }
  return productSuppliers;
};
