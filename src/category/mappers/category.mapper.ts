/**
 * @fileoverview Category Mapper
 *
 * Maps Category entity to ResponseCategoryDto.
 * Follows DRY principle - reusable in services, controllers, and tests.
 *
 * @module CategoryMapper
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Category } from '../entities/category.entity';
import { ResponseCategoryDto } from '../dto/response-category.dto';

export const mapCategoryToResponseDto = (
  category: Category,
): ResponseCategoryDto => {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    isDeleted: category.isDeleted,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt ?? undefined,
    deletedAt: category.deletedAt ?? null,
    deletedBy: category.deletedBy?.id ?? null,
  };
};

/**
 * Maps an array of Category entities to ResponseCategoryDto array.
 */
export const mapCategoriesToResponseDto = (
  categories: Category[],
): ResponseCategoryDto[] => {
  return categories.map((category) => mapCategoryToResponseDto(category));
};
