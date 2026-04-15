/**
 * @fileoverview CreateBrandDto - Brand creation DTO
 *
 * DTO for creating new brands - only fields needed for creation.
 * Follows Interface Segregation Principle.
 *
 * @module CreateBrandDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly name: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ required: false, nullable: true })
  readonly logo?: string | null;
}
