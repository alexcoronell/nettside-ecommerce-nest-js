/**
 * @fileoverview UpdateShipmentDto - Shipment update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateShipmentDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateShipmentDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import {
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@commons/decorators/trim.decorator';
import { ShipmentStatusEnum } from '@commons/enums/shipment-status.enum';

export class UpdateShipmentDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Trim()
  readonly trackingNumber?: string;

  @IsDate()
  @IsOptional()
  @ApiPropertyOptional()
  readonly shipmentDate?: Date;

  @IsDate()
  @IsOptional()
  @ApiPropertyOptional()
  readonly estimatedDeliveryDate?: Date;

  @IsEnum(ShipmentStatusEnum, {
    message: `Status must be a valid enum value: ${Object.values(ShipmentStatusEnum).join(', ')}`,
  })
  @IsOptional()
  @ApiPropertyOptional({ enum: ShipmentStatusEnum })
  readonly status?: ShipmentStatusEnum;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional()
  readonly sale?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly shippingCompany?: number;
}
