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
import { AuditResponse } from '@commons/interfaces/audit-response.interface';

export class ResponseDiscountDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly name: string;

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

  @ApiProperty()
  readonly minimumProductsCount: number;

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
  readonly createdBy: AuditResponse | null;

  @ApiPropertyOptional({ nullable: true })
  readonly updatedBy: AuditResponse | null;

  @ApiPropertyOptional({ nullable: true })
  readonly deletedAt: Date | null;

  @ApiProperty({ nullable: true })
  readonly deletedBy: AuditResponse | null;
}
