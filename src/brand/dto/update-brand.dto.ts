/**
 * @fileoverview UpdateBrandDto - Brand update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateBrandDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateBrandDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBrandDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ required: false, nullable: true })
  readonly logo?: string | null;
}
