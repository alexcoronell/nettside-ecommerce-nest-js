/**
 * @fileoverview CreatePurchaseDetailItemDto - Purchase detail item in create purchase
 *
 * DTO for a single purchase detail item when creating a purchase with details.
 * Used internally by CreatePurchaseDto - not exposed as separate endpoint.
 *
 * @module CreatePurchaseDetailItemDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePurchaseDetailItemDto {
  @IsNumber()
  @Min(1)
  @ApiProperty({
    type: Number,
    description: 'Product ID',
    example: 1,
  })
  readonly product: number;

  @IsNumber()
  @Min(1)
  @ApiProperty({
    type: Number,
    description: 'Quantity of the product',
    example: 5,
  })
  readonly quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @ApiProperty({
    type: Number,
    description: 'Unit price of the product',
    example: 299.99,
  })
  readonly unitPrice: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional({
    type: Number,
    description: 'Subtotal (quantity * unitPrice, calculated if not provided)',
    example: 1499.95,
  })
  readonly subtotal?: number;
}
