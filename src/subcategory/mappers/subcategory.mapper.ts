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
    category: { id: subcategory.category.id, name: subcategory.category.name },
    isDeleted: subcategory.isDeleted,
    createdAt: subcategory.createdAt,
    updatedAt: subcategory.updatedAt ?? undefined,
    createdBy: subcategory.createdBy?.id
      ? {
          id: subcategory.createdBy.id,
          firstname: subcategory.createdBy.firstname,
          lastname: subcategory.createdBy.lastname,
        }
      : null,
    updatedBy: subcategory.updatedBy?.id
      ? {
          id: subcategory.updatedBy.id,
          firstname: subcategory.updatedBy.firstname,
          lastname: subcategory.updatedBy.lastname,
        }
      : null,
    deletedAt: subcategory.deletedAt ?? null,
    deletedBy: subcategory.deletedBy?.id
      ? {
          id: subcategory.deletedBy.id,
          firstname: subcategory.deletedBy.firstname,
          lastname: subcategory.deletedBy.lastname,
        }
      : null,
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
