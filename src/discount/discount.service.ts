/**
 * @fileoverview DiscountService - Service for discount business logic
 *
 * Handles all business operations for discount management including
 * CRUD operations, pagination, and search.
 *
 * @module DiscountService
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

/* NestJS */
import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';

/* Entities */
import { Discount } from '@discount/entities/discount.entity';

/* DTO's */
import { CreateDiscountDto } from '@discount/dto/create-discount.dto';
import { UpdateDiscountDto } from '@discount/dto/update-discount.dto';
import { ResponseDiscountDto } from '@discount/dto/response-discount.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

/* Mappers */
import {
  mapDiscountToResponseDto,
  mapDiscountsToResponseDto,
} from './mappers/discount.mapper';
import { NameOnlyDto } from '@commons/dtos/name-only.dto';

/**
 * Service for managing discount operations.
 *
 * @description
 * Provides business logic for:
 * - Counting active discounts
 * - Listing discounts with pagination, search, and sorting
 * - Finding discounts by ID
 * - Creating, updating, and soft-deleting discounts
 *
 * All public methods return ResponseDiscountDto for consistent API responses.
 */
@Injectable()
export class DiscountService
  implements
    IBaseService<ResponseDiscountDto, CreateDiscountDto, UpdateDiscountDto>
{
  constructor(
    @InjectRepository(Discount)
    private readonly repo: Repository<Discount>,
  ) {}

  /**
   * Counts all active (non-deleted) discounts in the system.
   *
   * @returns Promise resolving to an object with statusCode and total count
   *
   * @example
   * const result = await discountService.count();
   * // Returns: { statusCode: 200, total: 25 }
   */
  async count(): Promise<Result<number>> {
    const total = await this.repo.count({
      where: {
        isDeleted: false,
      },
    });
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Retrieves all active category names without pagination or filters.
   *
   * @returns Promise resolving to a Result containing an array of category names only
   *
   * @example
   * const result = await categoryService.findAllNoPagination();
   * // Returns: { statusCode: 200, data: [{ name: 'Electronics' }, { name: 'Clothing' }, ...] }
   */
  async findAllNoPagination(): Promise<Result<NameOnlyDto[]>> {
    const categories = await this.repo.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
      select: ['id', 'name'],
    });

    return {
      statusCode: HttpStatus.OK,
      data: categories,
    };
  }

  /**
   * Retrieves a paginated list of active discounts with optional search and sorting.
   *
   * @param paginationDto - Optional pagination parameters (page, limit, search, sortBy, sortOrder)
   * @returns Promise resolving to a paginated result containing an array of ResponseDiscountDto
   *
   * @example
   * // Get first page with 10 items
   * const result = await discountService.findAll({ page: 1, limit: 10 });
   *
   * @example
   * // Search and sort
   * const result = await discountService.findAll({
   *   search: 'SUMMER',
   *   sortBy: 'name',
   *   sortOrder: 'ASC'
   * });
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<ResponseDiscountDto>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<Discount> = {
      isDeleted: false,
    };

    // Build search conditions for name and description
    const searchConditions: FindOptionsWhere<Discount>[] = [];
    if (paginationDto?.search) {
      const searchTerm = `%${paginationDto.search}%`;
      searchConditions.push(
        { ...where, name: ILike(searchTerm) },
        { ...where, description: ILike(searchTerm) },
      );
    }

    // Determine sort field and order
    const sortBy = paginationDto?.sortBy || 'name';
    const sortOrder = paginationDto?.sortOrder || 'ASC';

    // Execute query with relations
    const [discounts, total] = await this.repo.findAndCount({
      where: searchConditions.length > 0 ? searchConditions : where,
      relations: ['createdBy', 'updatedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Map to DTO and return paginated result
    const data = mapDiscountsToResponseDto(discounts);
    return PaginationHelper.createPaginatedResult(data, total, page, limit);
  }

  /**
   * Finds a single discount by its ID.
   *
   * @param id - The unique identifier of the discount
   * @returns Promise resolving to a Result containing the ResponseDiscountDto
   * @throws NotFoundException if discount is not found or is deleted
   *
   * @example
   * const result = await discountService.findOne(1);
   * // Returns: { statusCode: 200, data: { id: 1, name: 'SUMMER50', ... } }
   */
  async findOne(id: Discount['id']): Promise<Result<ResponseDiscountDto>> {
    const discount = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });

    if (!discount) {
      throw new NotFoundException(`The Discount with ID: ${id} not found`);
    }

    return {
      statusCode: HttpStatus.OK,
      data: mapDiscountToResponseDto(discount),
    };
  }

  /**
   * Creates a new discount.
   *
   * @param dto - CreateDiscountDto containing the discount data
   * @param userId - ID of the user creating the discount
   * @returns Promise resolving to a Result containing the created ResponseDiscountDto
   *
   * @example
   * const result = await discountService.create(
   *   { name: 'SUMMER50', value: 50, startDate: new Date() },
   *   1
   * );
   * // Returns: { statusCode: 201, data: { ... }, message: 'The Discount was created' }
   */
  async create(
    dto: CreateDiscountDto,
    userId: number,
  ): Promise<Result<ResponseDiscountDto>> {
    // Create new discount entity
    const newDiscount = this.repo.create({
      ...dto,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });

    const discount = await this.repo.save(newDiscount);

    // Fetch with relations for proper mapping
    const savedDiscount = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id: discount.id },
    });

    return {
      statusCode: HttpStatus.CREATED,
      data: mapDiscountToResponseDto(savedDiscount!),
      message: 'The Discount was created',
    };
  }

  /**
   * Updates an existing discount.
   *
   * @param id - ID of the discount to update
   * @param userId - ID of the user performing the update
   * @param changes - UpdateDiscountDto containing the fields to update
   * @returns Promise resolving to a Result containing the updated ResponseDiscountDto
   * @throws NotFoundException if discount is not found
   *
   * @example
   * const result = await discountService.update(1, 1, { value: 60 });
   * // Returns: { statusCode: 200, data: { ... }, message: 'The Discount with ID: 1 has been modified' }
   */
  async update(
    id: number,
    userId: number,
    changes: UpdateDiscountDto,
  ): Promise<Result<ResponseDiscountDto>> {
    const discountEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!discountEntity) {
      throw new NotFoundException(`The Discount with ID: ${id} not found`);
    }

    // Merge changes and update
    this.repo.merge(discountEntity, {
      ...changes,
      updatedBy: { id: userId },
    });

    const savedDiscount = await this.repo.save(discountEntity);

    // Fetch with relations for proper mapping
    const updatedDiscount = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id: savedDiscount.id },
    });

    return {
      statusCode: HttpStatus.OK,
      data: mapDiscountToResponseDto(updatedDiscount!),
      message: `The Discount with ID: ${id} has been modified`,
    };
  }

  /**
   * Soft deletes a discount by marking it as deleted.
   *
   * @param id - ID of the discount to delete
   * @param userId - ID of the user performing the deletion
   * @returns Promise resolving to an object with statusCode and message
   * @throws NotFoundException if discount is not found
   *
   * @example
   * const result = await discountService.remove(1, 1);
   * // Returns: { statusCode: 200, message: 'The Discount with ID: 1 has been deleted' }
   */
  async remove(
    id: Discount['id'],
    userId: number,
  ): Promise<{ statusCode: number; message: string }> {
    const discountEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!discountEntity) {
      throw new NotFoundException(`The Discount with ID: ${id} not found`);
    }

    // Soft delete by marking as deleted
    const changes = {
      isDeleted: true,
      deletedBy: { id: userId },
      deletedAt: new Date(),
    };
    this.repo.merge(discountEntity, changes);
    await this.repo.save(discountEntity);

    return {
      statusCode: HttpStatus.OK,
      message: `The Discount with ID: ${id} has been deleted`,
    };
  }
}
