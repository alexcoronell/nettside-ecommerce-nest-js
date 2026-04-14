/**
 * @fileoverview CreateProductDto - Product creation DTO
 *
 * DTO for creating new products - only fields needed for creation.
 * Follows Interface Segregation Principle.
 *
 * @module CreateProductDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@commons/decorators/trim.decorator';

export class CreateProductDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly name: string;

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
  @IsNotEmpty()
  @ApiProperty()
  readonly category: number;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty()
  readonly subcategory: number;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty()
  readonly brand: number;
}
