/**
 * @fileoverview ResponsePurchaseDto - Purchase response DTO
 *
 * DTO for API responses - excludes internal and sensitive fields.
 * Follows Interface Segregation Principle - separate from create/update.
 *
 * Includes purchaseDetails only when using findOne.
 *
 * @module ResponsePurchaseDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponsePurchaseDetailDto } from '@purchase_detail/dto/response-purchase-detail.dto';

export class ResponsePurchaseDto {
  @ApiProperty({
    type: Number,
    description: 'Unique identifier of the purchase',
  })
  readonly id: number;

  @ApiProperty({ type: Date, description: 'Date when the purchase was made' })
  readonly purchaseDate: Date;

  @ApiProperty({ type: Number, description: 'Total amount of the purchase' })
  readonly totalAmount: number;

  @ApiProperty({ type: Number, description: 'ID of the associated supplier' })
  readonly supplier: number;

  @ApiProperty({
    type: Boolean,
    description: 'Indicates if the purchase is soft-deleted',
  })
  readonly isDeleted: boolean;

  @ApiProperty({
    type: Date,
    description: 'Timestamp when the purchase was created',
  })
  readonly createdAt: Date;

  @ApiPropertyOptional({
    type: Date,
    description: 'Timestamp when the purchase was last updated',
  })
  readonly updatedAt: Date | null;

  @ApiPropertyOptional({
    type: Date,
    nullable: true,
    description: 'Timestamp when the purchase was soft-deleted',
  })
  readonly deletedAt: Date | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'ID of the user who soft-deleted the purchase',
  })
  readonly deletedBy: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'ID of the user who created the purchase',
  })
  readonly createdBy: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'ID of the user who last updated the purchase',
  })
  readonly updatedBy: number | null;

  @ApiPropertyOptional({
    type: [ResponsePurchaseDetailDto],
    nullable: true,
    description: 'Purchase details (only included in findOne)',
  })
  readonly purchaseDetails?: ResponsePurchaseDetailDto[];
}
