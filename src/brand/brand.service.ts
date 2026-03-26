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
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class BrandService
  implements IBaseService<Brand, CreateBrandDto, UpdateBrandDto>
{
  constructor(
    @InjectRepository(Brand)
    private readonly repo: Repository<Brand>,
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
   * Retrieves a list of all active (non-deleted) brands, sorted by name.
   *
   * Supports optional pagination and search via PaginationDto.
   * When no pagination options are provided, all brands are returned.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns {Promise<PaginatedResult<Brand>>} A standardized paginated response.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<Brand>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<Brand> = {
      isDeleted: false,
    };

    // Build search conditions
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

  async findAllWithRelations() {
    const [brands, total] = await this.repo.findAndCount({
      relations: ['createdBy', 'updatedBy'],
      where: {
        isDeleted: false,
      },
      order: {
        name: 'ASC',
      },
    });

    return {
      statusCode: HttpStatus.OK,
      data: brands,
      total,
    };
  }

  async findOne(id: Brand['id']): Promise<Result<Brand>> {
    const brand = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!brand) {
      throw new NotFoundException(`The Brand with ID: ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: brand,
    };
  }

  async findOneByName(name: string): Promise<Result<Brand>> {
    const brand = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { name, isDeleted: false },
    });
    if (!brand) {
      throw new NotFoundException(`The Brand with NAME: ${name} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: brand,
    };
  }

  async findOneBySlug(slug: string): Promise<Result<Brand>> {
    const brand = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { slug, isDeleted: false },
    });
    if (!brand) {
      throw new NotFoundException(`The Brand with SLUG: ${slug} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: brand,
    };
  }

  async create(dto: CreateBrandDto, userId: number) {
    const newBrand = this.repo.create({
      ...dto,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const brand = await this.repo.save(newBrand);
    return {
      statusCode: HttpStatus.CREATED,
      data: brand,
      message: 'The Brand was created',
    };
  }

  async update(id: number, userId: number, changes: UpdateBrandDto) {
    const { data } = await this.findOne(id);
    this.repo.merge(data as Brand, { ...changes, updatedBy: { id: userId } });
    const rta = await this.repo.save(data as Brand);
    return {
      statusCode: HttpStatus.OK,
      data: rta,
      message: `The Brand with ID: ${id} has been modified`,
    };
  }

  async remove(id: Brand['id'], userId: number) {
    const { data } = await this.findOne(id);

    const changes = { isDeleted: true, deletedBy: { id: userId } };
    this.repo.merge(data as Brand, changes);
    await this.repo.save(data as Brand);
    return {
      statusCode: HttpStatus.OK,
      message: `The Brand with ID: ${id} has been deleted`,
    };
  }
}
