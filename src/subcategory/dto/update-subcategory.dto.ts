/**
 * @fileoverview UpdateSubcategoryDto - Subcategory update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateSubcategoryDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateSubcategoryDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@commons/decorators/trim.decorator';

export class UpdateSubcategoryDto {
  @Trim()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly name?: string;

  @Trim()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly slug?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional()
  readonly category?: number;
}
