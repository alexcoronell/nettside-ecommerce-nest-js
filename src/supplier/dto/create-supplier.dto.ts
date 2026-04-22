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

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsPhoneNumber } from 'class-validator';

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

  @IsString()
  @ApiPropertyOptional()
  readonly webPage: string;

  @IsString()
  @ApiPropertyOptional()
  readonly state: string;

  @IsString()
  @ApiPropertyOptional()
  readonly county: string;

  @IsString()
  @ApiPropertyOptional()
  readonly city: string;

  @IsString()
  @ApiPropertyOptional()
  readonly streetAddress: string;

  @IsString()
  @ApiPropertyOptional()
  readonly postalCode: string;

  @IsString()
  @ApiPropertyOptional()
  readonly notes: string;
}
