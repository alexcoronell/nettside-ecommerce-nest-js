/**
 * @fileoverview Brand Mapper
 *
 * Maps Brand entity to ResponseBrandDto.
 * Follows DRY principle - reusable in services, controllers, and tests.
 *
 * @module BrandMapper
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Brand } from '../entities/brand.entity';
import { ResponseBrandDto } from '../dto/response-brand.dto';

export const mapBrandToResponseDto = (brand: Brand): ResponseBrandDto => {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo,
    isDeleted: brand.isDeleted,
    createdAt: brand.createdAt,
    createdBy: brand.createdBy?.id
      ? {
          id: brand.createdBy.id,
          firstname: brand.createdBy.firstname,
          lastname: brand.createdBy.lastname,
        }
      : null,
    updatedBy: brand.updatedBy?.id
      ? {
          id: brand.updatedBy.id,
          firstname: brand.updatedBy.firstname,
          lastname: brand.updatedBy.lastname,
        }
      : null,
    updatedAt: brand.updatedAt ?? undefined,
    deletedAt: brand.deletedAt ?? null,
    deletedBy: brand.deletedBy?.id
      ? {
          id: brand.deletedBy.id,
          firstname: brand.deletedBy.firstname,
          lastname: brand.deletedBy.lastname,
        }
      : null,
  };
};

/**
 * Maps an array of Brand entities to ResponseBrandDto array
 */
export const mapBrandsToResponseDto = (brands: Brand[]): ResponseBrandDto[] => {
  return brands.map((brand) => mapBrandToResponseDto(brand));
};
