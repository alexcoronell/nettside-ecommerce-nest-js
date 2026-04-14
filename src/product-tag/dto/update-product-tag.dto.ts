/**
 * @fileoverview UpdateProductTagDto - Product Tag update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Follows Interface Segregation Principle.
 * Note: ProductTag is a junction table - typically no updates needed.
 *
 * @module UpdateProductTagDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductTagDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly product?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly tag?: number;
}
