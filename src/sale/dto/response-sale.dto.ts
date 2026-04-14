/**
 * @fileoverview ResponseSaleDto - Sale response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseSaleDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty } from '@nestjs/swagger';
import { SaleStatusEnum } from '@commons/enums/sale-status.enum';

export class ResponseSaleDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly totalAmount: number;

  @ApiProperty()
  readonly shippingAddress: string;

  @ApiProperty({ enum: SaleStatusEnum })
  readonly status: SaleStatusEnum;

  @ApiProperty()
  readonly paymentMethod: number;

  @ApiProperty()
  readonly isDeleted: boolean;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly updatedAt: Date;

  @ApiProperty({ nullable: true })
  readonly deletedAt: Date | null;

  @ApiProperty({ nullable: true })
  readonly deletedBy: number | null;
}
