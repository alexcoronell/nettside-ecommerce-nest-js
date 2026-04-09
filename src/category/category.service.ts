import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';

/* Entities */
import { Category } from './entities/category.entity';

/* DTO's */
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';
/**
 * Service for managing categories in the application.
 * Implements the IBaseService interface for CRUD operations.
 */
@Injectable()
export class CategoryService
  implements IBaseService<Category, CreateCategoryDto, UpdateCategoryDto>
{
  /**
   * Constructor for the CategoryService.
   * @param repo - Injected TypeORM repository for the Category entity.
   */
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  /**
   * Counts all categories that are not marked as deleted.
   * @returns An object containing the total count of non-deleted categories and an HTTP status code.
   */
  async count() {
    const total = await this.repo.count({
      where: {
        isDeleted: false,
      },
    });
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Retrieves a list of all active (non-deleted) categories, sorted by name.
   *
   * Supports optional pagination and search via PaginationDto.
   * When no pagination options are provided, all categories are returned.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns {Promise<PaginatedResult<Category>>} A standardized paginated response.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<Category>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<Category> = {
      isDeleted: false,
    };

    // Build search conditions
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

    // Execute query
    const [data, total] = await this.repo.findAndCount({
      where: searchConditions.length > 0 ? searchConditions : where,
      relations: ['createdBy', 'updatedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Return paginated result
    return PaginationHelper.createPaginatedResult(data, total, page, limit);
  }

  /**
   * Finds a single category by its ID.
   * @param id - The ID of the category to retrieve.
   * @returns A Result object containing the category data and an HTTP status code.
   * @throws NotFoundException if the category is not found.
   */
  async findOne(id: Category['id']): Promise<Result<Category>> {
    const category = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!category) {
      throw new NotFoundException(`The Category with ID: ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: category,
    };
  }

  /**
   * Finds a single category by its slug.
   * @param slug - The slug of the category to retrieve.
   * @returns A Result object containing the category data and an HTTP status code.
   * @throws NotFoundException if the category is not found.
   */
  async findOneBySlug(slug: string): Promise<Result<Category>> {
    const category = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { slug, isDeleted: false },
    });
    if (!category) {
      throw new NotFoundException(`The Category with SLUG: ${slug} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: category,
    };
  }

  /**
   * Creates a new category.
   * @param dto - The data transfer object containing the category details.
   * @returns An object containing the created category, an HTTP status code, and a success message.
   */
  async create(dto: CreateCategoryDto, userId: number) {
    const newCategory = this.repo.create({
      ...dto,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const category = await this.repo.save(newCategory);
    return {
      statusCode: HttpStatus.CREATED,
      data: category,
      message: 'The category was created',
    };
  }

  /**
   * Updates an existing category by its ID.
   * @param id - The ID of the category to update.
   * @param changes - The data transfer object containing the updated category details.
   * @returns An object containing the updated category, an HTTP status code, and a success message.
   */
  async update(id: number, userId: number, changes: UpdateCategoryDto) {
    const { data } = await this.findOne(id);
    this.repo.merge(data as Category, {
      ...changes,
      updatedBy: { id: userId },
    });
    const rta = await this.repo.save(data as Category);
    return {
      statusCode: HttpStatus.OK,
      data: rta,
      message: `The Category with ID: ${id} has been modified`,
    };
  }

  /**
   * Marks a category as deleted by its ID.
   * @param id - The ID of the category to delete.
   * @returns An object containing an HTTP status code and a success message.
   */
  async remove(id: Category['id'], userId: number) {
    const { data } = await this.findOne(id);
    const changes = { isDeleted: true, deletedBy: { id: userId } };
    this.repo.merge(data as Category, changes);
    await this.repo.save(data as Category);
    return {
      statusCode: HttpStatus.OK,
      message: `The Category with ID: ${id} has been deleted`,
    };
  }
}
