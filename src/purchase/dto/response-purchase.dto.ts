/**
 * @fileoverview ResponsePurchaseDto - Purchase response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponsePurchaseDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty } from '@nestjs/swagger';

export class ResponsePurchaseDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly purchaseDate: Date;

  @ApiProperty()
  readonly totalAmount: number;

  @ApiProperty()
  readonly supplier: number;

  @ApiProperty()
  readonly isDeleted: boolean;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly updatedAt: Date;

  @ApiProperty({ nullable: true })
  readonly deletedAt: Date | null;

  @ApiProperty({ nullable: true })
  readonly deletedBy: number | null;
}
