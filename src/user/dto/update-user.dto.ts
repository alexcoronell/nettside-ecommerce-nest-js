/**
 * @fileoverview UpdateUserDto - User update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateUserDto to avoid inheriting password and unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateUserDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly firstname?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly lastname?: string;

  @IsEmail()
  @IsOptional()
  @ApiPropertyOptional()
  readonly email?: string;

  @IsPhoneNumber()
  @IsOptional()
  @ApiPropertyOptional()
  readonly phoneNumber?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  readonly isActive?: boolean;

  @IsEnum(UserRoleEnum, {
    message: `Role must be a valid enum value: ${Object.values(UserRoleEnum).join(', ')}`,
  })
  @IsOptional()
  @ApiPropertyOptional({ enum: UserRoleEnum })
  readonly role?: UserRoleEnum;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly department?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly city?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly address?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly neighborhood?: string;
}
