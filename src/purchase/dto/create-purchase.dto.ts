/**
 * @fileoverview CreatePurchaseDto - Purchase creation DTO
 *
 * DTO for creating new purchases - only contains creation-required fields.
 * Does NOT include update-only or internal fields.
 * Follows Interface Segregation Principle.
 *
 * @module CreatePurchaseDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsDate, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
