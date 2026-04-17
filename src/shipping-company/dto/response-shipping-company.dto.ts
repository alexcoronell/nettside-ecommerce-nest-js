/**
 * @fileoverview ResponseShippingCompanyDto - Shipping Company response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseShippingCompanyDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseShippingCompanyDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly contactName: string;

  @ApiProperty()
  readonly phoneNumber: string;

  @ApiProperty()
  readonly email: string;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiPropertyOptional()
  readonly updatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  readonly deletedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  readonly deletedBy: number | null;

  @ApiPropertyOptional({ nullable: true })
  readonly createdBy: number | null;

  @ApiPropertyOptional({ nullable: true })
  readonly updatedBy: number | null;
}
