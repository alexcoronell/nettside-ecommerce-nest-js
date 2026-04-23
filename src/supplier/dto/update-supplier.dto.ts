/**
 * @fileoverview UpdateSupplierDto - Supplier update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateSupplierDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateSupplierDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsEmail, IsPhoneNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSupplierDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly contactName?: string;

  @IsPhoneNumber()
  @IsOptional()
  @ApiPropertyOptional()
  readonly phoneNumber?: string;

  @IsEmail()
  @IsOptional()
  @ApiPropertyOptional()
  readonly email?: string;

  @IsString()
  @ApiPropertyOptional()
  readonly website: string;

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
