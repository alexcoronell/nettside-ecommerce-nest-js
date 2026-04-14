/**
 * @fileoverview ResponseProductDto - Product response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseProductDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseProductDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly name: string;

  @ApiPropertyOptional()
  readonly description: string | null;

  @ApiProperty()
  readonly price: number;

  @ApiProperty()
  readonly stock: number;

  @ApiProperty()
  readonly category: number;

  @ApiProperty()
  readonly subcategory: number;

  @ApiProperty()
  readonly brand: number;

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
