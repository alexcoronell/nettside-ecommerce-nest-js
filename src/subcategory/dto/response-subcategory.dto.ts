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
import { AuditResponse } from '@commons/interfaces/audit-response.interface';
import { NameOnlyDto } from '@commons/dtos/name-only.dto';

export class ResponseSubcategoryDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly slug: string;

  @ApiProperty()
  readonly category: NameOnlyDto;

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

  @ApiPropertyOptional({ nullable: true })
  readonly deletedBy: AuditResponse | null;
}
