/**
 * @fileoverview UpdateCategoryDto - Category update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateCategoryDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateCategoryDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly slug?: string;
}
