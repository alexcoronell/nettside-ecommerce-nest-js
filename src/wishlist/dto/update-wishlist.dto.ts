/**
 * @fileoverview UpdateWishlistDto - Wishlist update DTO
 *
 * DTO for partial updates - only fields that CAN be updated.
 * Follows Interface Segregation Principle.
 *
 * @module UpdateWishlistDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWishlistDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional()
  readonly product?: number;
}
