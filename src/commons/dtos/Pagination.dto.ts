/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/commons/dto/pagination.dto.ts
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsIn,
  IsObject,
} from 'class-validator';
import { HttpStatus } from '@nestjs/common';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Base pagination DTO for query parameters
 */
export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    example: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({
    description: 'Search term for filtering',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter term for filtering',
    example: '{"role": "admin"}',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsObject()
  filterBy?: Record<string, string>;
}

/**
 * Generic pagination response interface
 */
export interface PaginatedResult<T> {
  statusCode: number;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Helper class to create paginated responses
 */
export class PaginationHelper {
  static createPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      statusCode: HttpStatus.OK,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Calculates skip value for database queries
   */
  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Validates and normalizes pagination parameters
   */
  static normalizePagination(page?: number, limit?: number) {
    const normalizedPage = Math.max(1, page || 1);
    const normalizedLimit = Math.min(100, Math.max(1, limit || 10));

    return {
      page: normalizedPage,
      limit: normalizedLimit,
      skip: this.getSkip(normalizedPage, normalizedLimit),
    };
  }
}
