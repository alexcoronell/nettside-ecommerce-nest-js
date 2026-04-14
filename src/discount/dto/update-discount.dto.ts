/**
 * @fileoverview UpdateDiscountDto - Discount update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateDiscountDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateDiscountDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import {
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@commons/decorators/trim.decorator';

export class UpdateDiscountDto {
  @Trim()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly code?: string;

  @Trim()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly description?: string;

  @Trim()
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly type?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly value?: number;

  @IsDate()
  @IsOptional()
  @ApiPropertyOptional()
  readonly startDate?: Date;

  @IsDate()
  @IsOptional()
  @ApiPropertyOptional()
  readonly endDate?: Date;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly minimumOrderAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly usageLimit?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly usageLimitPerUser?: number;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  readonly active?: boolean;
}
