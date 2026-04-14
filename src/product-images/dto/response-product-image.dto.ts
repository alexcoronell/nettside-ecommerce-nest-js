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

export class ResponseProductImageDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly filePath: string;

  @ApiProperty()
  readonly title: string;

  @ApiProperty()
  readonly isMain: boolean;

  @ApiProperty()
  readonly product: number;

  @ApiProperty()
  readonly isActive: boolean;

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
