/**
 * @fileoverview Product Mapper
 *
 * Maps Product entity to ResponseProductDto.
 * Follows DRY principle - reusable in services, controllers, and tests.
 *
 * @module ProductMapper
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Product } from '../entities/product.entity';
import { ResponseProductDto } from '../dto/response-product.dto';

export const mapProductToResponseDto = (
  product: Product,
): ResponseProductDto => {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    stock: product.stock,
    category: product.category?.id ?? 0,
    subcategory: product.subcategory?.id ?? 0,
    brand: product.brand?.id ?? 0,
    isDeleted: product.isDeleted,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt ?? undefined,
    deletedAt: product.deletedAt ?? null,
    deletedBy: product.deletedBy?.id ?? null,
  };
};

/**
 * Maps an array of Product entities to ResponseProductDto array
 */
export const mapProductsToResponseDto = (
  products: Product[],
): ResponseProductDto[] => {
  return products.map((product) => mapProductToResponseDto(product));
};
