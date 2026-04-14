/**
 * @fileoverview ResponseDiscountDto - Discount response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseDiscountDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseDiscountDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly code: string;

  @ApiPropertyOptional()
  readonly description: string | null;

  @ApiPropertyOptional()
  readonly type: string | null;

  @ApiProperty()
  readonly value: number;

  @ApiProperty()
  readonly startDate: Date;

  @ApiPropertyOptional()
  readonly endDate: Date | null;

  @ApiProperty()
  readonly minimumOrderAmount: number;

  @ApiPropertyOptional()
  readonly usageLimit: number | null;

  @ApiPropertyOptional()
  readonly usageLimitPerUser: number | null;

  @ApiProperty()
  readonly active: boolean;

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
