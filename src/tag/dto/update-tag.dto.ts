/**
 * @fileoverview UpdateTagDto - Tag update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Does NOT extend CreateTagDto to avoid inheriting unwanted fields.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateTagDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTagDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  readonly name?: string;
}
