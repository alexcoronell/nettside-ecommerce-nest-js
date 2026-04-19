/**
 * @fileoverview ResponseSaleDto - Sale response DTO
 *
 * DTO for API responses - excludes internal fields.
 * Includes relations (user, paymentMethod) as nested objects.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseSaleDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SaleStatusEnum } from '@commons/enums/sale-status.enum';

/**
 * Nested DTO for User relation in responses.
 */
class ResponseUserDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly email: string;

  @ApiPropertyOptional()
  readonly firstName?: string;

  @ApiPropertyOptional()
  readonly lastName?: string;
}

/**
 * Nested DTO for PaymentMethod relation in responses.
 */
class ResponsePaymentMethodDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly name: string;
}

/**
 * Data transfer object for sale API responses.
 *
 * @example
 * {
 *   "id": 1,
 *   "saleDate": "2024-01-15T10:30:00.000Z",
 *   "totalAmount": 1500.00,
 *   "shippingAddress": "Calle Falsa 123, Buenos Aires",
 *   "status": "PENDING_PAYMENT",
 *   "isCancelled": false,
 *   "cancelledAt": null,
 *   "user": {
 *     "id": 1,
 *     "email": "user@example.com",
 *     "firstName": "Juan",
 *     "lastName": "Pérez"
 *   },
 *   "paymentMethod": {
 *     "id": 1,
 *     "name": "Visa"
 *   },
 *   "createdAt": "2024-01-15T10:30:00.000Z",
 *   "updatedAt": "2024-01-15T10:30:00.000Z"
 * }
 */
export class ResponseSaleDto {
  @ApiProperty({
    description: 'Unique identifier of the sale',
    example: 1,
  })
  readonly id: number;

  @ApiProperty({
    description: 'Date when the sale was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  readonly saleDate: Date;

  @ApiProperty({
    type: Number,
    description: 'Total amount of the sale',
    example: 1500.0,
  })
  readonly totalAmount: number;

  @ApiProperty({
    type: String,
    description: 'Shipping address for the sale',
    example: 'Calle Falsa 123, Buenos Aires',
  })
  readonly shippingAddress: string;

  @ApiProperty({
    enum: SaleStatusEnum,
    description: 'Current status of the sale',
    example: SaleStatusEnum.PENDING_PAYMENT,
  })
  readonly status: SaleStatusEnum;

  @ApiProperty({
    description: 'Whether the sale has been cancelled',
    example: false,
  })
  readonly isCancelled: boolean;

  @ApiPropertyOptional({
    type: Date,
    description: 'Date when the sale was cancelled',
    example: null,
  })
  readonly cancelledAt: Date | null;

  @ApiProperty({
    type: ResponseUserDto,
    description: 'User who created the sale',
  })
  readonly user: ResponseUserDto;

  @ApiProperty({
    type: ResponsePaymentMethodDto,
    description: 'Payment method used for the sale',
  })
  readonly paymentMethod: ResponsePaymentMethodDto;
}
