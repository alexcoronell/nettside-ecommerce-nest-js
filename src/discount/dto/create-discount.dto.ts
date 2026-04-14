/**
 * @fileoverview CreateDiscountDto - Discount creation DTO
 *
 * DTO for creating new discounts - only fields needed for creation.
 * Follows Interface Segregation Principle.
 *
 * @module CreateDiscountDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDate,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@commons/decorators/trim.decorator';

export class CreateDiscountDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly code: string;

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
  @IsNotEmpty()
  @ApiProperty()
  readonly startDate: Date;

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
  @ApiPropertyOptional({ default: true })
  readonly active?: boolean;
}
