/**
 * @fileoverview Discount Mapper
 *
 * Maps Discount entity to ResponseDiscountDto.
 * Follows DRY principle - reusable in services, controllers, and tests.
 *
 * @module DiscountMapper
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Discount } from '../entities/discount.entity';
import { ResponseDiscountDto } from '../dto/response-discount.dto';

export const mapDiscountToResponseDto = (
  discount: Discount,
): ResponseDiscountDto => {
  return {
    id: discount.id,
    name: discount.name,
    description: discount.description ?? null,
    type: discount.type ?? null,
    value: Number(discount.value),
    startDate: discount.startDate,
    endDate: discount.endDate ?? null,
    minimumOrderAmount: Number(discount.minimumOrderAmount),
    minimumProductsCount: Number(discount.minimumProductsCount),
    usageLimit: discount.usageLimit ?? null,
    usageLimitPerUser: discount.usageLimitPerUser ?? null,
    active: discount.active,
    isDeleted: discount.isDeleted,
    createdAt: discount.createdAt,
    updatedAt: discount.updatedAt ?? undefined,
    createdBy: discount.createdBy?.id
      ? {
          id: discount.createdBy.id,
          firstname: discount.createdBy.firstname,
          lastname: discount.createdBy.lastname,
        }
      : null,
    updatedBy: discount.updatedBy?.id
      ? {
          id: discount.updatedBy.id,
          firstname: discount.updatedBy.firstname,
          lastname: discount.updatedBy.lastname,
        }
      : null,
    deletedAt: discount.deletedAt ?? null,
    deletedBy: discount.deletedBy?.id
      ? {
          id: discount.deletedBy.id,
          firstname: discount.deletedBy.firstname,
          lastname: discount.deletedBy.lastname,
        }
      : null,
  };
};

/**
 * Maps an array of Discount entities to ResponseDiscountDto array.
 */
export const mapDiscountsToResponseDto = (
  discounts: Discount[],
): ResponseDiscountDto[] => {
  return discounts.map((discount) => mapDiscountToResponseDto(discount));
};
