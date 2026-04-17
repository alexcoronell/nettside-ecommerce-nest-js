/**
 * @fileoverview CreatePurchaseDto - Purchase creation DTO
 *
 * DTO for creating new purchases - only contains creation-required fields.
 * Does NOT include update-only or internal fields.
 * Follows Interface Segregation Principle.
 *
 * Supports optional details array for creating purchase with items in one operation.
 *
 * @module CreatePurchaseDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreatePurchaseDetailItemDto } from './create-purchase-detail-item.dto';

export class CreatePurchaseDto {
  @IsDate()
  @IsNotEmpty()
  @ApiProperty({
    type: Date,
    description: 'Purchase date',
    example: '2024-01-15T10:30:00.000Z',
  })
  readonly purchaseDate: Date;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    description: 'Total amount of the purchase',
    example: 1500.0,
  })
  readonly totalAmount: number;

  @IsNumber()
  @Min(1)
  @ApiProperty({
    type: Number,
    description: 'ID of the supplier associated with the purchase',
    example: 1,
  })
  readonly supplier: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseDetailItemDto)
  @ApiPropertyOptional({
    type: [CreatePurchaseDetailItemDto],
    description: 'Purchase detail items (optional)',
    example: [
      { product: 1, quantity: 5, unitPrice: 299.99, subtotal: 1499.95 },
    ],
  })
  readonly details?: CreatePurchaseDetailItemDto[];
}
