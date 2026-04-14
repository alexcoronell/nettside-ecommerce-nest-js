/**
 * @fileoverview UpdateShippingCompanyDto - Shipping Company update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateShippingCompanyDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateShippingCompanyDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsEmail, IsPhoneNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateShippingCompanyDto {
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
}
