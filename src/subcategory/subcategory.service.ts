import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';
/* Entities */
import { Subcategory } from './entities/subcategory.entity';

/* DTO's */
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class SubcategoryService
  implements
    IBaseService<Subcategory, CreateSubcategoryDto, UpdateSubcategoryDto>
{
  constructor(
    @InjectRepository(Subcategory)
    private readonly repo: Repository<Subcategory>,
  ) {}

  async countAll() {
    const total = await this.repo.count();
    return { statusCode: HttpStatus.OK, total };
  }

  async count() {
    const total = await this.repo.count({
      where: {
        isDeleted: false,
      },
    });
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Retrieves a list of all active (non-deleted) subcategories, sorted by name.
   *
   * Supports optional pagination and search via PaginationDto.
   * When no pagination options are provided, all subcategories are returned.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns {Promise<PaginatedResult<Subcategory>>} A standardized paginated response.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<Subcategory>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<Subcategory> = {
      isDeleted: false,
    };

    // Build search conditions
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

    // Execute query
    const [data, total] = await this.repo.findAndCount({
      where: searchConditions.length > 0 ? searchConditions : where,
      relations: ['category', 'createdBy', 'updatedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Return paginated result
    return PaginationHelper.createPaginatedResult(data, total, page, limit);
  }

  async findAllByCategory(categoryId: number): Promise<Result<Subcategory[]>> {
    const [data, total] = await this.repo.findAndCount({
      where: { category: { id: categoryId }, isDeleted: false },
      order: { name: 'ASC' },
    });
    return {
      statusCode: HttpStatus.OK,
      data,
      total,
    };
  }

  async findAllByCategoryAndName(
    categoryId: number,
    name: string,
  ): Promise<Result<Subcategory[]>> {
    const [data, total] = await this.repo.findAndCount({
      where: { category: { id: categoryId }, name },
    });
    return {
      statusCode: HttpStatus.OK,
      data,
      total,
    };
  }

  async findOne(id: Subcategory['id']) {
    const data = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!data) {
      throw new NotFoundException(`The Subcategory with ID: ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  async findOneByName(name: string): Promise<Result<Subcategory>> {
    const data = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { name, isDeleted: false },
    });
    if (!data) {
      throw new NotFoundException(
        `The Subcategory with NAME: ${name} not found`,
      );
    }
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  async findOneBySlug(slug: string): Promise<Result<Subcategory>> {
    const data = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { slug, isDeleted: false },
    });
    if (!data) {
      throw new NotFoundException(
        `The Subcategory with SLUG: ${slug} not found`,
      );
    }
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  async create(dto: CreateSubcategoryDto, userId: number) {
    const categoryId = dto.category;

    const newSubcategory = this.repo.create({
      ...dto,
      category: { id: categoryId },
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const data = await this.repo.save(newSubcategory);
    return {
      statusCode: HttpStatus.CREATED,
      data,
      message: `The Subcategory was created`,
    };
  }

  async update(id: number, userId: number, changes: UpdateSubcategoryDto) {
    const { data } = await this.findOne(id);
    const categoryId = changes.category;
    this.repo.merge(data, {
      ...changes,
      category: { id: categoryId },
      updatedBy: { id: userId },
    });
    const rta = await this.repo.save(data);
    return {
      statusCode: HttpStatus.OK,
      data: rta,
      message: `The Subcategory with ID: ${id} has been modified`,
    };
  }

  async remove(id: Subcategory['id'], userId: number) {
    const { data } = await this.findOne(id);
    const changes = {
      isDeleted: true,
      deletedBy: { id: userId },
      deletedAt: new Date(),
    };
    this.repo.merge(data, changes);
    await this.repo.save(data);
    return {
      statusCode: HttpStatus.OK,
      message: `The Subcategory with ID: ${id} has been deleted`,
    };
  }
}
