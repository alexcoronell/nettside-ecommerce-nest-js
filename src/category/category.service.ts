/**
 * @fileoverview CategoryService - Service for category business logic
 *
 * Handles all business operations for category management including
 * CRUD operations, pagination, and search.
 *
 * @module CategoryService
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
import { Category } from './entities/category.entity';

/* DTO's */
import { CreateCategoryDto } from '@category/dto/create-category.dto';
import { UpdateCategoryDto } from '@category/dto/update-category.dto';
import { ResponseCategoryDto } from '@category/dto/response-category.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

/* Utils */
import { createSlug } from '@commons/utils/create-slug.util';

/* Mappers */
import {
  mapCategoryToResponseDto,
  mapCategoriesToResponseDto,
} from './mappers/category.mapper';

/**
 * Service for managing category operations.
 *
 * @description
 * Provides business logic for:
 * - Counting active categories
 * - Listing categories with pagination, search, and sorting
 * - Finding categories by ID or slug
 * - Creating, updating, and soft-deleting categories
 *
 * All public methods return ResponseCategoryDto for consistent API responses.
 */
@Injectable()
export class CategoryService
  implements
    IBaseService<ResponseCategoryDto, CreateCategoryDto, UpdateCategoryDto>
{
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  /**
   * Counts all active (non-deleted) categories in the system.
   *
   * @returns Promise resolving to an object with statusCode and total count
   *
   * @example
   * const result = await categoryService.count();
   * // Returns: { statusCode: 200, total: 15 }
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
   * Retrieves a paginated list of active categories with optional search and sorting.
   *
   * @param paginationDto - Optional pagination parameters (page, limit, search, sortBy, sortOrder)
   * @returns Promise resolving to a paginated result containing an array of ResponseCategoryDto
   *
   * @example
   * // Get first page with 10 items
   * const result = await categoryService.findAll({ page: 1, limit: 10 });
   *
   * @example
   * // Search and sort
   * const result = await categoryService.findAll({
   *   search: 'electronics',
   *   sortBy: 'name',
   *   sortOrder: 'ASC'
   * });
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<ResponseCategoryDto>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<Category> = {
      isDeleted: false,
    };

    // Build search conditions for name and slug
    const searchConditions: FindOptionsWhere<Category>[] = [];
    if (paginationDto?.search) {
      const searchTerm = `%${paginationDto.search}%`;
      searchConditions.push(
        { ...where, name: ILike(searchTerm) },
        { ...where, slug: ILike(searchTerm) },
      );
    }

    // Determine sort field and order
    const sortBy = paginationDto?.sortBy || 'name';
    const sortOrder = paginationDto?.sortOrder || 'ASC';

    // Execute query with relations
    const [categories, total] = await this.repo.findAndCount({
      where: searchConditions.length > 0 ? searchConditions : where,
      relations: ['createdBy', 'updatedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Map to DTO and return paginated result
    const data = mapCategoriesToResponseDto(categories);
    return PaginationHelper.createPaginatedResult(data, total, page, limit);
  }

  /**
   * Finds a single category by its ID.
   *
   * @param id - The unique identifier of the category
   * @returns Promise resolving to a Result containing the ResponseCategoryDto
   * @throws NotFoundException if category is not found or is deleted
   *
   * @example
   * const result = await categoryService.findOne(1);
   * // Returns: { statusCode: 200, data: { id: 1, name: 'Electronics', ... } }
   */
  async findOne(id: Category['id']): Promise<Result<ResponseCategoryDto>> {
    const category = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });

    if (!category) {
      throw new NotFoundException(`The Category with ID: ${id} not found`);
    }

    return {
      statusCode: HttpStatus.OK,
      data: mapCategoryToResponseDto(category),
    };
  }

  /**
   * Finds a single category by its slug.
   *
   * @param slug - The URL-friendly slug of the category
   * @returns Promise resolving to a Result containing the ResponseCategoryDto
   * @throws NotFoundException if category is not found or is deleted
   *
   * @example
   * const result = await categoryService.findOneBySlug('electronics');
   * // Returns: { statusCode: 200, data: { id: 1, name: 'Electronics', slug: 'electronics', ... } }
   */
  async findOneBySlug(slug: string): Promise<Result<ResponseCategoryDto>> {
    const category = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { slug, isDeleted: false },
    });

    if (!category) {
      throw new NotFoundException(`The Category with SLUG: ${slug} not found`);
    }

    return {
      statusCode: HttpStatus.OK,
      data: mapCategoryToResponseDto(category),
    };
  }

  /**
   * Creates a new category.
   *
   * @param dto - CreateCategoryDto containing the category data
   * @param userId - ID of the user creating the category
   * @returns Promise resolving to a Result containing the created ResponseCategoryDto
   *
   * @example
   * const result = await categoryService.create(
   *   { name: 'Electronics' },
   *   1
   * );
   * // Returns: { statusCode: 201, data: { ... }, message: 'The Category was created' }
   */
  async create(
    dto: CreateCategoryDto,
    userId: number,
  ): Promise<Result<ResponseCategoryDto>> {
    // Auto-create slug from name
    const slug = createSlug(dto.name);

    // Create new category entity
    const newCategory = this.repo.create({
      name: dto.name,
      slug,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });

    const category = await this.repo.save(newCategory);

    // Fetch with relations for proper mapping
    const savedCategory = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id: category.id },
    });

    return {
      statusCode: HttpStatus.CREATED,
      data: mapCategoryToResponseDto(savedCategory!),
      message: 'The Category was created',
    };
  }

  /**
   * Updates an existing category.
   *
   * @param id - ID of the category to update
   * @param userId - ID of the user performing the update
   * @param changes - UpdateCategoryDto containing the fields to update
   * @returns Promise resolving to a Result containing the updated ResponseCategoryDto
   * @throws NotFoundException if category is not found
   *
   * @example
   * const result = await categoryService.update(1, 1, { name: 'Tech' });
   * // Returns: { statusCode: 200, data: { ... }, message: 'The Category with ID: 1 has been modified' }
   */
  async update(
    id: number,
    userId: number,
    changes: UpdateCategoryDto,
  ): Promise<Result<ResponseCategoryDto>> {
    const categoryEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!categoryEntity) {
      throw new NotFoundException(`The Category with ID: ${id} not found`);
    }

    // Merge changes and update
    this.repo.merge(categoryEntity, {
      ...changes,
      updatedBy: { id: userId },
    });

    const savedCategory = await this.repo.save(categoryEntity);

    // Fetch with relations for proper mapping
    const updatedCategory = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id: savedCategory.id },
    });

    return {
      statusCode: HttpStatus.OK,
      data: mapCategoryToResponseDto(updatedCategory!),
      message: `The Category with ID: ${id} has been modified`,
    };
  }

  /**
   * Soft deletes a category by marking it as deleted.
   *
   * @param id - ID of the category to delete
   * @param userId - ID of the user performing the deletion
   * @returns Promise resolving to an object with statusCode and message
   * @throws NotFoundException if category is not found
   *
   * @example
   * const result = await categoryService.remove(1, 1);
   * // Returns: { statusCode: 200, message: 'The Category with ID: 1 has been deleted' }
   */
  async remove(
    id: Category['id'],
    userId: number,
  ): Promise<{ statusCode: number; message: string }> {
    const categoryEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!categoryEntity) {
      throw new NotFoundException(`The Category with ID: ${id} not found`);
    }

    // Soft delete by marking as deleted
    const changes = { isDeleted: true, deletedBy: { id: userId } };
    this.repo.merge(categoryEntity, changes);
    await this.repo.save(categoryEntity);

    return {
      statusCode: HttpStatus.OK,
      message: `The Category with ID: ${id} has been deleted`,
    };
  }
}
