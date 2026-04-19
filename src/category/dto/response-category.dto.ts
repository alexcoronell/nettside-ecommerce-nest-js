/**
 * @fileoverview ResponseCategoryDto - Category response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseCategoryDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { AuditResponse } from '@commons/interfaces/audit-response.interface';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseCategoryDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly slug: string;

  @ApiProperty()
  readonly isDeleted: boolean;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly updatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  readonly createdBy: AuditResponse | null;

  @ApiPropertyOptional({ nullable: true })
  readonly updatedBy: AuditResponse | null;

  @ApiProperty({ nullable: true })
  readonly deletedAt: Date | null;

  @ApiProperty({ nullable: true })
  readonly deletedBy: AuditResponse | null;
}
