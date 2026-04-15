/**
 * @fileoverview CreatePaymentMethodDto - Payment Method creation DTO
 *
 * DTO for creating new payment methods - only fields needed for creation.
 * Follows Interface Segregation Principle.
 *
 * @module CreatePaymentMethodDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Credit Card',
    description: 'Payment method name (unique)',
  })
  readonly name: string;
}
