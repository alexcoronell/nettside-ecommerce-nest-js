/**
 * @fileoverview SubcategoryService - Service for subcategory business logic
 *
 * Handles all business operations for subcategory management including
 * CRUD operations, pagination, search, and slug generation.
 *
 * @module SubcategoryService
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

/* NestJS */
import {
  ConflictException,
  Injectable,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';

/* Entities */
import { Subcategory } from './entities/subcategory.entity';

/* DTO's */
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { ResponseSubcategoryDto } from './dto/response-subcategory.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';
import { NameOnlyDto } from '@commons/dtos/name-only.dto';

/* Utils */
import { createSlug } from '@commons/utils/create-slug.util';

/* Mappers */
import {
  mapSubcategoryToResponseDto,
  mapSubcategoriesToResponseDto,
} from './mappers/subcategory.mapper';

/**
 * Service for managing subcategory operations.
 *
 * @description
 * Provides business logic for:
 * - Counting active subcategories
 * - Listing subcategories with pagination, search, and sorting
 * - Finding subcategories by ID or slug
 * - Creating, updating, and soft-deleting subcategories
 *
 * All public methods return ResponseSubcategoryDto for consistent API responses.
 * Slugs are auto-generated from names using createSlug utility.
 */
@Injectable()
export class SubcategoryService
  implements
    IBaseService<
      ResponseSubcategoryDto,
      CreateSubcategoryDto,
      UpdateSubcategoryDto
    >
{
  constructor(
    @InjectRepository(Subcategory)
    private readonly repo: Repository<Subcategory>,
  ) {}

  /**
   * Counts all active (non-deleted) subcategories in the system.
   *
   * @returns Promise resolving to an object with statusCode and total count
   *
   * @example
   * const result = await subcategoryService.count();
   * // Returns: { statusCode: 200, total: 12 }
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
    const subcategories = await this.repo.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
      select: ['id', 'name'],
    });

    return {
      statusCode: HttpStatus.OK,
      data: subcategories,
    };
  }

  /**
   * Retrieves a paginated list of active subcategories with optional search and sorting.
   *
   * @param paginationDto - Optional pagination parameters (page, limit, search, sortBy, sortOrder)
   * @returns Promise resolving to a paginated result containing an array of ResponseSubcategoryDto
   *
   * @example
   * // Get first page with 10 items
   * const result = await subcategoryService.findAll({ page: 1, limit: 10 });
   *
   * @example
   * // Search and sort
   * const result = await subcategoryService.findAll({
   *   search: 'electronics',
   *   sortBy: 'name',
   *   sortOrder: 'ASC'
   * });
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<ResponseSubcategoryDto>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<Subcategory> = {
      isDeleted: false,
    };

    // Build search conditions for name and slug
    const searchConditions: FindOptionsWhere<Subcategory>[] = [];
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
    const [subcategories, total] = await this.repo.findAndCount({
      where: searchConditions.length > 0 ? searchConditions : where,
      relations: ['category', 'createdBy', 'updatedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Map to DTO and return paginated result
    const data = mapSubcategoriesToResponseDto(subcategories);
    return PaginationHelper.createPaginatedResult(data, total, page, limit);
  }

  /**
   * Retrieves all active subcategories for a specific category.
   *
   * @param categoryId - The ID of the category to filter by
   * @returns Promise resolving to a Result containing an array of ResponseSubcategoryDto
   *
   * @example
   * const result = await subcategoryService.findAllByCategory(1);
   */
  async findAllByCategory(
    categoryId: number,
  ): Promise<Result<ResponseSubcategoryDto[]>> {
    const [data, total] = await this.repo.findAndCount({
      where: { category: { id: categoryId }, isDeleted: false },
      relations: ['category', 'createdBy', 'updatedBy'],
      order: { name: 'ASC' },
    });

    return {
      statusCode: HttpStatus.OK,
      data: mapSubcategoriesToResponseDto(data),
      total,
    };
  }

  /**
   * Finds a single subcategory by its ID.
   *
   * @param id - The unique identifier of the subcategory
   * @returns Promise resolving to a Result containing the ResponseSubcategoryDto
   * @throws NotFoundException if subcategory is not found or is deleted
   *
   * @example
   * const result = await subcategoryService.findOne(1);
   * // Returns: { statusCode: 200, data: { id: 1, name: '...', ... } }
   */
  async findOne(
    id: Subcategory['id'],
  ): Promise<Result<ResponseSubcategoryDto>> {
    const subcategory = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy', 'category'],
      where: { id, isDeleted: false },
    });

    if (!subcategory) {
      throw new NotFoundException(`The Subcategory with ID: ${id} not found`);
    }

    return {
      statusCode: HttpStatus.OK,
      data: mapSubcategoryToResponseDto(subcategory),
    };
  }

  /**
   * Finds a single subcategory by its slug.
   *
   * @param slug - The URL-friendly slug of the subcategory
   * @returns Promise resolving to a Result containing the ResponseSubcategoryDto
   * @throws NotFoundException if subcategory is not found or is deleted
   *
   * @example
   * const result = await subcategoryService.findOneBySlug('electronics');
   */
  async findOneBySlug(slug: string): Promise<Result<ResponseSubcategoryDto>> {
    const subcategory = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy', 'category'],
      where: { slug, isDeleted: false },
    });

    if (!subcategory) {
      throw new NotFoundException(
        `The Subcategory with SLUG: ${slug} not found`,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      data: mapSubcategoryToResponseDto(subcategory),
    };
  }

  /**
   * Creates a new subcategory.
   *
   * @param dto - CreateSubcategoryDto containing the subcategory data
   * @param userId - ID of the user creating the subcategory
   * @returns Promise resolving to a Result containing the created ResponseSubcategoryDto
   * @throws ConflictException if subcategory name already exists in the same category
   *
   * @example
   * const result = await subcategoryService.create(
   *   { name: 'Smartphones', category: 1 },
   *   1
   * );
   * // Returns: { statusCode: 201, data: { ... }, message: 'The Subcategory was created' }
   */
  async create(
    dto: CreateSubcategoryDto,
    userId: number,
  ): Promise<Result<ResponseSubcategoryDto>> {
    const categoryId = dto.category;

    // Check for existing subcategory with same name in same category
    const existingSubcategory = await this.repo.findOne({
      where: { name: dto.name, category: { id: categoryId }, isDeleted: false },
    });

    if (existingSubcategory) {
      throw new ConflictException(
        `The Subcategory NAME ${dto.name} is already in use with the same Category`,
      );
    }

    // Auto-generate slug from name
    const slug = createSlug(dto.name);

    // Create new subcategory entity
    const newSubcategory = this.repo.create({
      ...dto,
      slug,
      category: { id: categoryId },
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });

    const subcategory = await this.repo.save(newSubcategory);

    // Fetch with relations for proper mapping
    const savedSubcategory = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy', 'category'],
      where: { id: subcategory.id },
    });

    return {
      statusCode: HttpStatus.CREATED,
      data: mapSubcategoryToResponseDto(savedSubcategory!),
      message: 'The Subcategory was created',
    };
  }

  /**
   * Updates an existing subcategory.
   *
   * @param id - ID of the subcategory to update
   * @param userId - ID of the user performing the update
   * @param changes - UpdateSubcategoryDto containing the fields to update
   * @returns Promise resolving to a Result containing the updated ResponseSubcategoryDto
   * @throws NotFoundException if subcategory is not found
   * @throws ConflictException if subcategory name already exists in the same category
   *
   * @example
   * const result = await subcategoryService.update(1, 1, { name: 'New Name' });
   * // Returns: { statusCode: 200, data: { ... }, message: 'The Subcategory with ID: 1 has been modified' }
   */
  async update(
    id: number,
    userId: number,
    changes: UpdateSubcategoryDto,
  ): Promise<Result<ResponseSubcategoryDto>> {
    // Find existing subcategory
    const existingSubcategory = await this.repo.findOne({
      relations: ['category'],
      where: { id, isDeleted: false },
    });

    if (!existingSubcategory) {
      throw new NotFoundException(`The Subcategory with ID: ${id} not found`);
    }

    // Check for name conflicts (excluding current subcategory)
    if (changes.name) {
      // Get the category ID to check against
      const checkCategoryId =
        changes.category ?? existingSubcategory.category?.id;

      // Find potential conflict with same name in a category using a direct approach
      // First find all with the same name, then check category manually
      const potentialConflict = await this.repo.findOne({
        where: { name: changes.name, isDeleted: false },
        relations: ['category'],
      });

      // If found, check if it's in the same category and different id
      if (potentialConflict) {
        const conflictCategoryId = potentialConflict.category?.id;
        if (
          conflictCategoryId === checkCategoryId &&
          potentialConflict.id !== id
        ) {
          throw new ConflictException(
            `The Subcategory NAME ${changes.name} is already in use with the same Category`,
          );
        }
      }

      // Auto-generate new slug if name changed
      const newSlug = createSlug(changes.name);

      // Check if new slug already exists (from any other subcategory)
      const slugConflict = await this.repo.findOne({
        where: { slug: newSlug, isDeleted: false },
      });

      if (slugConflict && slugConflict.id !== id) {
        // Generate unique slug by appending category id
        changes['slug'] = `${newSlug}-${checkCategoryId}`;
      } else {
        changes['slug'] = newSlug;
      }
    }

    // Merge changes and update
    this.repo.merge(existingSubcategory, {
      ...changes,
      category: changes.category
        ? { id: changes.category }
        : existingSubcategory.category,
      updatedBy: { id: userId },
    });

    const savedSubcategory = await this.repo.save(existingSubcategory);

    // Fetch with relations for proper mapping
    const updatedSubcategory = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy', 'category'],
      where: { id: savedSubcategory.id },
    });

    return {
      statusCode: HttpStatus.OK,
      data: mapSubcategoryToResponseDto(updatedSubcategory!),
      message: `The Subcategory with ID: ${id} has been modified`,
    };
  }

  /**
   * Soft deletes a subcategory by marking it as deleted.
   *
   * @param id - ID of the subcategory to delete
   * @param userId - ID of the user performing the deletion
   * @returns Promise resolving to an object with statusCode and message
   * @throws NotFoundException if subcategory is not found
   *
   * @example
   * const result = await subcategoryService.remove(1, 1);
   * // Returns: { statusCode: 200, message: 'The Subcategory with ID: 1 has been deleted' }
   */
  async remove(
    id: Subcategory['id'],
    userId: number,
  ): Promise<{ statusCode: number; message: string }> {
    const subcategoryEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!subcategoryEntity) {
      throw new NotFoundException(`The Subcategory with ID: ${id} not found`);
    }

    // Soft delete by marking as deleted
    const changes = {
      isDeleted: true,
      deletedBy: { id: userId },
      deletedAt: new Date(),
    };

    this.repo.merge(subcategoryEntity, changes);
    await this.repo.save(subcategoryEntity);

    return {
      statusCode: HttpStatus.OK,
      message: `The Subcategory with ID: ${id} has been deleted`,
    };
  }
}
