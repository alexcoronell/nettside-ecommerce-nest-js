/**
 * @fileoverview ResponseSaleDetailDto - Sale Detail response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseSaleDetailDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty } from '@nestjs/swagger';

export class ResponseSaleDetailDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly quantity: number;

  @ApiProperty()
  readonly unitPrice: number;

  @ApiProperty()
  readonly subtotal: number;

  @ApiProperty()
  readonly sale: number;

  @ApiProperty()
  readonly product: number;
}
