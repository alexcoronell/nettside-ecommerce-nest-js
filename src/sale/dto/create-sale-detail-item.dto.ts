/**
 * @fileoverview CreateSaleDetailItemDto - Sale detail item in create sale
 *
 * DTO for a single sale detail item when creating a sale with details.
 * Used internally by CreateSaleDto - not exposed as separate endpoint.
 *
 * @module CreateSaleDetailItemDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSaleDetailItemDto {
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
    example: 2,
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
    example: 599.98,
  })
  readonly subtotal?: number;
}
