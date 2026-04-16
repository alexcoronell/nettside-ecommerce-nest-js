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

import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@commons/decorators/trim.decorator';

export class CreateSubcategoryDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Electronics',
    description: 'Subcategory name (unique within category)',
  })
  readonly name: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
    description: 'Category ID to which this subcategory belongs',
  })
  readonly category: number;
}
