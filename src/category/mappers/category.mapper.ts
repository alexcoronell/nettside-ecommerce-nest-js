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
    createdBy: category.createdBy?.id
      ? {
          id: category.createdBy.id,
          firstname: category.createdBy.firstname,
          lastname: category.createdBy.lastname,
        }
      : null,
    updatedBy: category.updatedBy?.id
      ? {
          id: category.updatedBy.id,
          firstname: category.updatedBy.firstname,
          lastname: category.updatedBy.lastname,
        }
      : null,
    deletedAt: category.deletedAt ?? null,
    deletedBy: category.deletedBy?.id
      ? {
          id: category.deletedBy.id,
          firstname: category.deletedBy.firstname,
          lastname: category.deletedBy.lastname,
        }
      : null,
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
