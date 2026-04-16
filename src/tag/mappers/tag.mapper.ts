/**
 * @fileoverview Tag Mapper
 *
 * Maps Tag entity to ResponseTagDto.
 * Follows DRY principle - reusable in services, controllers, and tests.
 *
 * @module TagMapper
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Tag } from '../entities/tag.entity';
import { ResponseTagDto } from '../dto/response-tag.dto';

export const mapTagToResponseDto = (tag: Tag): ResponseTagDto => {
  return {
    id: tag.id,
    name: tag.name,
    isDeleted: tag.isDeleted,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
    deletedAt: tag.deletedAt ?? null,
    deletedBy: tag.deletedBy?.id ?? null,
    createdBy: tag.createdBy?.id ? { id: tag.createdBy.id } : undefined,
    updatedBy: tag.updatedBy?.id ? { id: tag.updatedBy.id } : undefined,
  };
};

/**
 * Maps an array of Tag entities to ResponseTagDto array.
 */
export const mapTagsToResponseDto = (tags: Tag[]): ResponseTagDto[] => {
  return tags.map((tag) => mapTagToResponseDto(tag));
};
