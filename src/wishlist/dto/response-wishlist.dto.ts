/**
 * @fileoverview ResponseWishlistDto - Wishlist response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * @module ResponseWishlistDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty } from '@nestjs/swagger';

export class ResponseWishlistDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly product: number;

  @ApiProperty()
  readonly user: number;

  @ApiProperty()
  readonly isDeleted: boolean;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly updatedAt: Date;

  @ApiProperty({ nullable: true })
  readonly deletedAt: Date | null;

  @ApiProperty({ nullable: true })
  readonly deletedBy: number | null;
}
