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
    code: discount.code,
    description: discount.description ?? null,
    type: discount.type ?? null,
    value: Number(discount.value),
    startDate: discount.startDate,
    endDate: discount.endDate ?? null,
    minimumOrderAmount: Number(discount.minimumOrderAmount),
    usageLimit: discount.usageLimit ?? null,
    usageLimitPerUser: discount.usageLimitPerUser ?? null,
    active: discount.active,
    isDeleted: discount.isDeleted,
    createdAt: discount.createdAt,
    updatedAt: discount.updatedAt ?? undefined,
    deletedAt: discount.deletedAt ?? null,
    deletedBy: discount.deletedBy?.id ?? null,
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
