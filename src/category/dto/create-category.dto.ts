/**
 * @fileoverview CreateCategoryDto - Category creation DTO
 *
 * DTO for creating new categories - only fields needed for creation.
 * Follows Interface Segregation Principle.
 *
 * @module CreateCategoryDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly name: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly slug?: string;
}
