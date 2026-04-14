/**
 * @fileoverview UpdateProductDto - Product update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateProductDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateProductDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@commons/decorators/trim.decorator';

export class UpdateProductDto {
  @Trim()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly name?: string;

  @Trim()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly price?: number;

  @IsNumber({ maxDecimalPlaces: 0 })
  @IsOptional()
  @ApiPropertyOptional()
  readonly stock?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional()
  readonly category?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional()
  readonly subcategory?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional()
  readonly brand?: number;
}
