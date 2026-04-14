/**
 * @fileoverview UpdateStoreDetailDto - Store Detail update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateStoreDetailDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateStoreDetailDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsOptional, IsPhoneNumber, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoreDetailDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ nullable: true })
  readonly name?: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ nullable: true })
  readonly country?: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ nullable: true })
  readonly state?: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ nullable: true })
  readonly city?: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ nullable: true })
  readonly neighborhood?: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ nullable: true })
  readonly address?: string | null;

  @IsPhoneNumber()
  @IsOptional()
  @ApiPropertyOptional({ nullable: true })
  readonly phone?: string | null;

  @IsEmail()
  @IsOptional()
  @ApiPropertyOptional({ nullable: true })
  readonly email?: string | null;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ nullable: true })
  readonly legalInformation?: string | null;
}
