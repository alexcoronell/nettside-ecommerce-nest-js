/**
 * @fileoverview UpdateProductSupplierDto - Product Supplier update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateProductSupplierDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateProductSupplierDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@commons/decorators/trim.decorator';

export class UpdateProductSupplierDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Trim()
  readonly supplierProductCode?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly costPrice?: number;

  @IsOptional()
  @ApiPropertyOptional()
  readonly isPrimarySupplier?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly product?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly supplier?: number;
}
