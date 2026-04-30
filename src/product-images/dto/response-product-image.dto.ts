/**
 * @fileoverview ResponseProductImageDto - Product Image response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseProductImageDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty } from '@nestjs/swagger';
import { AuditResponse } from '@commons/interfaces/audit-response.interface';

export class ResponseProductImageDto {
  @ApiProperty()
  readonly id!: number;

  @ApiProperty()
  readonly product!: number;

  @ApiProperty()
  readonly filePath!: string;

  @ApiProperty()
  readonly title!: string;

  @ApiProperty()
  readonly isMain!: boolean;

  @ApiProperty()
  readonly isActive!: boolean;

  @ApiProperty()
  readonly createdBy!: AuditResponse | null;

  @ApiProperty()
  readonly updatedBy!: AuditResponse | null;

  @ApiProperty()
  readonly createdAt!: Date;

  @ApiProperty()
  readonly updatedAt!: Date;
}
