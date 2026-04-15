/**
 * @fileoverview BrandService - Service for brand business logic
 *
 * Handles all business operations for brand management including
 * CRUD operations, pagination, search, and logo management.
 *
 * @module BrandService
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
import { Brand } from '@brand/entities/brand.entity';

/* DTO's */
import { CreateBrandDto } from '@brand/dto/create-brand.dto';
import { UpdateBrandDto } from '@brand/dto/update-brand.dto';
import { ResponseBrandDto } from '@brand/dto/response-brand.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

/* Utils */
import { createSlug } from '@commons/utils/create-slug.util';

/* Services */
import { UploadService } from '@upload/upload.service';

/* Mappers */
import {
  mapBrandToResponseDto,
  mapBrandsToResponseDto,
} from './mappers/brand.mapper';

/**
 * Service for managing brand operations.
 *
 * @description
 * Provides business logic for:
 * - Counting active brands
 * - Listing brands with pagination, search, and sorting
 * - Finding brands by ID or slug
 * - Creating, updating, and soft-deleting brands
 * - Managing brand logo uploads and deletions
 *
 * All public methods return ResponseBrandDto for consistent API responses.
 */
@Injectable()
export class BrandService
  implements IBaseService<ResponseBrandDto, CreateBrandDto, UpdateBrandDto>
{
  constructor(
    @InjectRepository(Brand)
    private readonly repo: Repository<Brand>,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Counts all active (non-deleted) brands in the system.
   *
   * @returns Promise resolving to an object with statusCode and total count
   *
   * @example
   * const result = await brandService.count();
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
   * Retrieves a paginated list of active brands with optional search and sorting.
   *
   * @param paginationDto - Optional pagination parameters (page, limit, search, sortBy, sortOrder)
   * @returns Promise resolving to a paginated result containing an array of ResponseBrandDto
   *
   * @example
   * // Get first page with 10 items
   * const result = await brandService.findAll({ page: 1, limit: 10 });
   *
   * @example
   * // Search and sort
   * const result = await brandService.findAll({
   *   search: 'nike',
   *   sortBy: 'name',
   *   sortOrder: 'ASC'
   * });
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<ResponseBrandDto>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<Brand> = {
      isDeleted: false,
    };

    // Build search conditions for name and slug
    const searchConditions: FindOptionsWhere<Brand>[] = [];
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
    const [brands, total] = await this.repo.findAndCount({
      where: searchConditions.length > 0 ? searchConditions : where,
      relations: ['createdBy', 'updatedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Map to DTO and return paginated result
    const data = mapBrandsToResponseDto(brands);
    return PaginationHelper.createPaginatedResult(data, total, page, limit);
  }

  /**
   * Finds a single brand by its ID.
   *
   * @param id - The unique identifier of the brand
   * @returns Promise resolving to a Result containing the ResponseBrandDto
   * @throws NotFoundException if brand is not found or is deleted
   *
   * @example
   * const result = await brandService.findOne(1);
   * // Returns: { statusCode: 200, data: { id: 1, name: 'Nike', ... } }
   */
  async findOne(id: Brand['id']): Promise<Result<ResponseBrandDto>> {
    const brand = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });

    if (!brand) {
      throw new NotFoundException(`The Brand with ID: ${id} not found`);
    }

    return {
      statusCode: HttpStatus.OK,
      data: mapBrandToResponseDto(brand),
    };
  }

  /**
   * Finds a single brand by its slug.
   *
   * @param slug - The URL-friendly slug of the brand
   * @returns Promise resolving to a Result containing the ResponseBrandDto
   * @throws NotFoundException if brand is not found or is deleted
   *
   * @example
   * const result = await brandService.findOneBySlug('nike');
   * // Returns: { statusCode: 200, data: { id: 1, name: 'Nike', slug: 'nike', ... } }
   */
  async findOneBySlug(slug: Brand['slug']): Promise<Result<ResponseBrandDto>> {
    const brand = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { slug, isDeleted: false },
    });

    if (!brand) {
      throw new NotFoundException(`The Brand with SLUG: ${slug} not found`);
    }

    return {
      statusCode: HttpStatus.OK,
      data: mapBrandToResponseDto(brand),
    };
  }

  /**
   * Creates a new brand.
   *
   * @param dto - CreateBrandDto containing the brand data
   * @param userId - ID of the user creating the brand
   * @returns Promise resolving to a Result containing the created ResponseBrandDto
   * @throws ConflictException if brand name already exists
   *
   * @example
   * const result = await brandService.create(
   *   { name: 'Nike', description: 'Sports brand' },
   *   1
   * );
   * // Returns: { statusCode: 201, data: { ... }, message: 'The Brand was created' }
   */
  async create(
    dto: CreateBrandDto,
    userId: number,
  ): Promise<Result<ResponseBrandDto>> {
    // Auto-create slug from name
    const slug = createSlug(dto.name);

    // Create new brand entity
    const newBrand = this.repo.create({
      ...dto,
      slug,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });

    const brand = await this.repo.save(newBrand);

    // Fetch with relations for proper mapping
    const savedBrand = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id: brand.id },
    });

    return {
      statusCode: HttpStatus.CREATED,
      data: mapBrandToResponseDto(savedBrand!),
      message: 'The Brand was created',
    };
  }

  /**
   * Updates an existing brand.
   *
   * @param id - ID of the brand to update
   * @param userId - ID of the user performing the update
   * @param changes - UpdateBrandDto containing the fields to update
   * @param file - Optional file for logo update
   * @returns Promise resolving to a Result containing the updated ResponseBrandDto
   * @throws NotFoundException if brand is not found
   * @throws ConflictException if new name already exists
   *
   * @example
   * const result = await brandService.update(1, 1, { name: 'Adidas' });
   * // Returns: { statusCode: 200, data: { ... }, message: 'The Brand with ID: 1 has been modified' }
   */
  async update(
    id: number,
    userId: number,
    changes: UpdateBrandDto,
    file?: Express.Multer.File,
  ): Promise<Result<ResponseBrandDto>> {
    const brandEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!brandEntity) {
      throw new NotFoundException(`The Brand with ID: ${id} not found`);
    }

    // Handle logo upload/deletion
    let logoValue: string | null | undefined = changes.logo;

    if (!file && brandEntity.logo) {
      // Delete existing logo if no new file provided
      const extracted = this.uploadService.extractKeyFromUrl(brandEntity.logo);
      if (extracted) {
        await this.uploadService.deleteFile(extracted.key, extracted.bucket);
      }
      logoValue = null;
    } else if (file) {
      // Upload new logo and delete old one if exists
      if (brandEntity.logo) {
        const extracted = this.uploadService.extractKeyFromUrl(
          brandEntity.logo,
        );
        if (extracted) {
          await this.uploadService.deleteFile(extracted.key, extracted.bucket);
        }
      }
      const uploadResult = await this.uploadService.uploadLogo(file);
      logoValue = uploadResult.url;
    }

    // Prepare update data
    const updateData = {
      ...changes,
      ...(logoValue !== undefined && { logo: logoValue }),
      updatedBy: { id: userId },
    };

    // Merge and save
    this.repo.merge(brandEntity, updateData);
    const savedBrand = await this.repo.save(brandEntity);

    // Fetch with relations for proper mapping
    const updatedBrand = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id: savedBrand.id },
    });

    return {
      statusCode: HttpStatus.OK,
      data: mapBrandToResponseDto(updatedBrand!),
      message: `The Brand with ID: ${id} has been modified`,
    };
  }

  /**
   * Soft deletes a brand by marking it as deleted.
   *
   * @param id - ID of the brand to delete
   * @param userId - ID of the user performing the deletion
   * @returns Promise resolving to an object with statusCode and message
   * @throws NotFoundException if brand is not found
   *
   * @example
   * const result = await brandService.remove(1, 1);
   * // Returns: { statusCode: 200, message: 'The Brand with ID: 1 has been deleted' }
   */
  async remove(
    id: Brand['id'],
    userId: number,
  ): Promise<{ statusCode: number; message: string }> {
    const brandEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!brandEntity) {
      throw new NotFoundException(`The Brand with ID: ${id} not found`);
    }

    // Soft delete by marking as deleted
    const changes = { isDeleted: true, deletedBy: { id: userId } };
    this.repo.merge(brandEntity, changes);
    await this.repo.save(brandEntity);

    return {
      statusCode: HttpStatus.OK,
      message: `The Brand with ID: ${id} has been deleted`,
    };
  }
}
