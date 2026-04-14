/**
 * @fileoverview UpdateSaleDetailDto - Sale Detail update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateSaleDetailDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateSaleDetailDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSaleDetailDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional()
  readonly quantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly unitPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly subtotal?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional()
  readonly sale?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional()
  readonly product?: number;
}
