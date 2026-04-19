/**
 * @fileoverview CreateSaleDto - Sale creation DTO
 *
 * DTO for creating new sales. Only contains fields the client CAN provide.
 * Does NOT include internal fields like status, user (comes from cookie), etc.
 * Follows Interface Segregation Principle - separate from update/response.
 *
 * Supports optional details array for creating sale with items in one operation.
 *
 * @module CreateSaleDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateSaleDetailItemDto } from './create-sale-detail-item.dto';

/**
 * Data transfer object for creating a new sale.
 *
 * @example
 * {
 *   "totalAmount": 1500.00,
 *   "shippingAddress": "Calle Falsa 123, Buenos Aires",
 *   "paymentMethod": 1,
 *   "details": [
 *     { "product": 1, "quantity": 2, "unitPrice": 299.99, "subtotal": 599.98 }
 *   ]
 * }
 */
export class CreateSaleDto {
  /**
   * Total amount of the sale.
   * Must be a positive number.
   */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    description: 'Total amount of the sale',
    example: 1500.0,
  })
  readonly totalAmount: number;

  /**
   * Shipping address for the sale.
   */
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Shipping address for the sale',
    example: 'Calle Falsa 123, Buenos Aires',
  })
  readonly shippingAddress: string;

  /**
   * Payment method ID associated with this sale.
   * Must be a valid payment method from the database.
   */
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    description: 'Payment method ID',
    example: 1,
  })
  readonly paymentMethod: number;

  /**
   * Optional sale detail items.
   * If provided, creates sale with associated details.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleDetailItemDto)
  @ApiPropertyOptional({
    type: [CreateSaleDetailItemDto],
    description: 'Sale detail items (optional)',
    example: [{ product: 1, quantity: 2, unitPrice: 299.99, subtotal: 599.98 }],
  })
  readonly details?: CreateSaleDetailItemDto[];
}
