/**
 * @fileoverview CreateSupplierDto - Supplier creation DTO
 *
 * DTO for creating new suppliers - only fields needed for creation.
 * Follows Interface Segregation Principle.
 *
 * @module CreateSupplierDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsNotEmpty, IsEmail, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly contactName: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  @ApiProperty()
  readonly phoneNumber: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  readonly email: string;
}
