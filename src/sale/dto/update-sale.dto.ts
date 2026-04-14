/**
 * @fileoverview UpdateSaleDto - Sale update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateSaleDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateSaleDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SaleStatusEnum } from '@commons/enums/sale-status.enum';

export class UpdateSaleDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly totalAmount?: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly shippingAddress?: string;

  @IsEnum(SaleStatusEnum, {
    message: `Sale Status must be a valid enum value: ${Object.values(SaleStatusEnum).join(', ')}`,
  })
  @IsOptional()
  @ApiPropertyOptional({ enum: SaleStatusEnum })
  readonly status?: SaleStatusEnum;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly paymentMethod?: number;
}
