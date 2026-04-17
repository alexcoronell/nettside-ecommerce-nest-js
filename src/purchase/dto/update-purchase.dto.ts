/**
 * @fileoverview UpdatePurchaseDto - Purchase update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreatePurchaseDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * All fields are optional to support partial updates (PATCH).
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
  @ApiPropertyOptional({
    type: Date,
    description: 'Purchase date',
    example: '2024-01-15T10:30:00.000Z',
  })
  readonly purchaseDate?: Date;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional({
    type: Number,
    description: 'Total amount of the purchase',
    example: 1500.0,
  })
  readonly totalAmount?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({
    type: Number,
    description: 'ID of the supplier associated with the purchase',
    example: 1,
  })
  readonly supplier?: number;
}
