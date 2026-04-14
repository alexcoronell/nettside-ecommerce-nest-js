/**
 * @fileoverview CreateSubcategoryDto - Subcategory creation DTO
 *
 * DTO for creating new subcategories - only fields needed for creation.
 * Follows Interface Segregation Principle.
 *
 * @module CreateSubcategoryDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@commons/decorators/trim.decorator';

export class CreateSubcategoryDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly name: string;

  @Trim()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly slug?: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty()
  readonly category: number;
}
