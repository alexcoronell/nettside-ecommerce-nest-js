/**
 * @fileoverview ResponseUserDto - User response DTO
 *
 * DTO for API responses - excludes password and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseUserDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRoleEnum } from '@commons/enums/user-role.enum';

export class ResponseUserDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly firstname: string;

  @ApiProperty()
  readonly lastname: string;

  @ApiProperty()
  readonly email: string;

  @ApiProperty()
  readonly phoneNumber: string;

  @ApiProperty()
  readonly isActive: boolean;

  @ApiProperty({ enum: UserRoleEnum })
  readonly role: UserRoleEnum;

  @ApiProperty()
  readonly department: string;

  @ApiProperty()
  readonly city: string;

  @ApiProperty()
  readonly address: string;

  @ApiProperty()
  readonly neighborhood: string;

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

  @ApiPropertyOptional({ nullable: true })
  readonly createdBy?: { id: number } | null;

  @ApiPropertyOptional({ nullable: true })
  readonly updatedBy?: { id: number } | null;
}
