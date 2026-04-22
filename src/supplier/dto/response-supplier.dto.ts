/**
 * @fileoverview ResponseSupplierDto - Supplier response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseSupplierDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditResponse } from '@commons/interfaces/audit-response.interface';

export class ResponseSupplierDto {
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

  @ApiPropertyOptional()
  readonly webPage: string;

  @ApiPropertyOptional()
  readonly state: string;

  @ApiPropertyOptional()
  readonly county: string;

  @ApiPropertyOptional()
  readonly city: string;

  @ApiPropertyOptional()
  readonly streetAddress: string;

  @ApiPropertyOptional()
  readonly postalCode: string;

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

  @ApiPropertyOptional({ nullable: true })
  readonly deletedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  readonly deletedBy: AuditResponse | null;

  @ApiPropertyOptional()
  readonly notes: string;
}
