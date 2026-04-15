/**
 * @fileoverview CreateCategoryDto - Category creation DTO
 *
 * DTO for creating new categories - only fields needed for creation.
 * Follows Interface Segregation Principle.
 *
 * NOTE: slug is NOT included - it is auto-generated from name.
 *
 * @module CreateCategoryDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Electronics',
    description: 'Category name (unique)',
  })
  readonly name: string;
}
