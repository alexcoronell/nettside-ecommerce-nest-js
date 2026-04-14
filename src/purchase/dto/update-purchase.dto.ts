/**
 * @fileoverview UpdatePurchaseDto - Purchase update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreatePurchaseDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdatePurchaseDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsDate, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePurchaseDto {
  @IsDate()
  @IsOptional()
  @ApiPropertyOptional({ type: Date })
  readonly purchaseDate?: Date;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly totalAmount?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional()
  readonly supplier?: number;
}
