/**
 * @fileoverview ResponseStoreDetailDto - Store Detail response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseStoreDetailDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseStoreDetailDto {
  @ApiPropertyOptional({ nullable: true })
  readonly id: number | null;

  @ApiPropertyOptional({ nullable: true })
  readonly name: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly country: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly state: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly city: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly neighborhood: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly address: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly phone: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly email: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly legalInformation: string | null;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiPropertyOptional()
  readonly updatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  readonly createdBy: number | null;

  @ApiPropertyOptional({ nullable: true })
  readonly updatedBy: number | null;
}
