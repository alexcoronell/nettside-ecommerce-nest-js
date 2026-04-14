/**
 * @fileoverview ResponseProductSupplierDto - Product Supplier response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseProductSupplierDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty } from '@nestjs/swagger';

export class ResponseProductSupplierDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly product: number;

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
