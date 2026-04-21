/**
 * @fileoverview NameOnlyDto - Generic DTO for returning only name field
 *
 * Reusable DTO for endpoints that return a list of names only (e.g., dropdowns, selects).
 * Uses generics to support any entity type.
 *
 * @module NameOnlyDto
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic DTO for returning id and name fields.
 * Use when endpoint needs to return data for dropdowns/selects.
 *
 * @example
 * // For category names
 * type CategoryNameOnly = NameOnlyDto<number>;
 *
 * @example
 * // For brand names
 * type BrandNameOnly = NameOnlyDto<number>;
 */
export class NameOnlyDto<T = number> {
  @ApiProperty({
    description: 'The entity ID',
    example: 1,
  })
  readonly id: T;

  @ApiProperty({
    description: 'The name value',
    examples: ['Electronics', 'Nike', 'Store Name'],
  })
  readonly name: string;
}
