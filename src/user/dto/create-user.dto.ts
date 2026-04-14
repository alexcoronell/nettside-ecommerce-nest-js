/**
 * @fileoverview CreateUserDto - User creation DTO
 *
 * DTO for creating new users - only fields needed for creation.
 * Does NOT include isActive, isDeleted, role is optional (defaults to CUSTOMER).
 * Follows Interface Segregation Principle.
 *
 * @module CreateUserDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly firstname: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly lastname: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly password: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  @ApiProperty()
  readonly phoneNumber: string;

  @IsEnum(UserRoleEnum, {
    message: `Role must be a valid enum value: ${Object.values(UserRoleEnum).join(', ')}`,
  })
  @IsOptional()
  @ApiPropertyOptional({ enum: UserRoleEnum, default: UserRoleEnum.CUSTOMER })
  readonly role?: UserRoleEnum;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly department: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly city: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly address: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly neighborhood: string;
}
