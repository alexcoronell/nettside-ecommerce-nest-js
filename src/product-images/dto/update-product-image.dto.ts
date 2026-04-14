/**
 * @fileoverview UpdateProductImageDto - Product Image update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateProductImageDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateProductImageDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@commons/decorators/trim.decorator';

export class UpdateProductImageDto {
  @Trim()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly title?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  readonly isMain?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  readonly isActive?: boolean;
}
