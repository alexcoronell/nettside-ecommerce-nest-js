/**
 * @fileoverview ResponseBrandDto - Brand response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseBrandDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AuditResponse } from '@commons/interfaces/audit-response.interface';

export class ResponseBrandDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly slug: string;

  @ApiPropertyOptional({ nullable: true })
  readonly logo: string | null;

  @ApiProperty()
  readonly isDeleted: boolean;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiPropertyOptional({ nullable: true })
  readonly createdBy: AuditResponse | null;

  @ApiPropertyOptional({ nullable: true })
  readonly updatedBy: AuditResponse | null;

  @ApiPropertyOptional()
  readonly updatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  readonly deletedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  readonly deletedBy: AuditResponse | null;
}
