/**
 * @fileoverview CreateSaleDto - Sale creation DTO
 *
 * DTO for creating new sales. Only contains fields the client CAN provide.
 * Does NOT include internal fields like status, user (comes from cookie), etc.
 * Follows Interface Segregation Principle - separate from update/response.
 *
 * @module CreateSaleDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data transfer object for creating a new sale.
 *
 * @example
 * {
 *   "totalAmount": 1500.00,
 *   "shippingAddress": "Calle Falsa 123, Buenos Aires",
 *   "paymentMethod": 1
 * }
 */
export class CreateSaleDto {
  /**
   * Total amount of the sale.
   * Must be a positive number.
   */
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    description: 'Total amount of the sale',
    example: 1500.0,
  })
  totalAmount: number;

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
  shippingAddress: string;

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
  paymentMethod: number;
}
