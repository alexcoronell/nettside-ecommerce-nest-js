/**
 * @fileoverview UpdatePurchaseDetailDto - Purchase Detail update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreatePurchaseDetailDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdatePurchaseDetailDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePurchaseDetailDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional()
  readonly quantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly unitPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly subtotal?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional()
  readonly product?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional()
  readonly purchase?: number;
}
