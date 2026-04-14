/**
 * @fileoverview ResponseShipmentDto - Shipment response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseShipmentDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShipmentStatusEnum } from '@commons/enums/shipment-status.enum';

export class ResponseShipmentDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly trackingNumber: string;

  @ApiProperty()
  readonly shipmentDate: Date;

  @ApiPropertyOptional()
  readonly estimatedDeliveryDate: Date | null;

  @ApiProperty({ enum: ShipmentStatusEnum })
  readonly status: ShipmentStatusEnum;

  @ApiProperty()
  readonly sale: number;

  @ApiProperty()
  readonly shippingCompany: number;

  @ApiProperty()
  readonly isDeleted: boolean;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiPropertyOptional()
  readonly updatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  readonly deletedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  readonly deletedBy: number | null;
}
