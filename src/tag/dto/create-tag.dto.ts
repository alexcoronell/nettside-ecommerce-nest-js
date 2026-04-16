/**
 * @fileoverview CreateTagDto - Tag creation DTO
 *
 * DTO for creating new tags - only fields needed for creation.
 * Follows Interface Segregation Principle.
 *
 * @module CreateTagDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly name: string;
}
