/**
 * @fileoverview Subcategory Mapper
 *
 * Maps Subcategory entity to ResponseSubcategoryDto.
 * Follows DRY principle - reusable in services, controllers, and tests.
 *
 * @module SubcategoryMapper
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Subcategory } from '../entities/subcategory.entity';
import { ResponseSubcategoryDto } from '../dto/response-subcategory.dto';

export const mapSubcategoryToResponseDto = (
  subcategory: Subcategory,
): ResponseSubcategoryDto => {
  return {
    id: subcategory.id,
    name: subcategory.name,
    slug: subcategory.slug,
    category: subcategory.category?.id ?? subcategory.category,
    isDeleted: subcategory.isDeleted,
    createdAt: subcategory.createdAt,
    updatedAt: subcategory.updatedAt ?? undefined,
    deletedAt: subcategory.deletedAt ?? null,
    deletedBy: subcategory.deletedBy?.id ?? null,
  };
};

/**
 * Maps an array of Subcategory entities to ResponseSubcategoryDto array.
 */
export const mapSubcategoriesToResponseDto = (
  subcategories: Subcategory[],
): ResponseSubcategoryDto[] => {
  return subcategories.map((sc) => mapSubcategoryToResponseDto(sc));
};
