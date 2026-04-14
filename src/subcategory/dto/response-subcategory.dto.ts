/**
 * @fileoverview ResponseSubcategoryDto - Subcategory response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseSubcategoryDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseSubcategoryDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly slug: string;

  @ApiProperty()
  readonly category: number;

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
