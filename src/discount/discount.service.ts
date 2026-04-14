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
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class DiscountService
  implements IBaseService<Discount, CreateDiscountDto, UpdateDiscountDto>
{
  constructor(
    @InjectRepository(Discount)
    private readonly repo: Repository<Discount>,
  ) {}

  async count() {
    const total = await this.repo.count({
      where: {
        isDeleted: false,
      },
    });
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Retrieves a list of all active (non-deleted) discounts, sorted by code.
   *
   * Supports optional pagination and search via PaginationDto.
   * When no pagination options are provided, all discounts are returned.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns {Promise<PaginatedResult<Discount>>} A standardized paginated response.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<Discount>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<Discount> = {
      isDeleted: false,
    };

    // Build search conditions
    const searchConditions: FindOptionsWhere<Discount>[] = [];
    if (paginationDto?.search) {
      const searchTerm = `%${paginationDto.search}%`;
      searchConditions.push(
        { ...where, code: ILike(searchTerm) },
        { ...where, description: ILike(searchTerm) },
      );
    }

    // Determine sort field and order
    const sortBy = paginationDto?.sortBy || 'code';
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

  async findOne(id: Discount['id']): Promise<Result<Discount>> {
    const discount = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!discount) {
      throw new NotFoundException(`The Discount with ID: ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: discount,
    };
  }

  async create(dto: CreateDiscountDto, userId: number) {
    const newDiscount = this.repo.create({
      ...dto,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const discount = await this.repo.save(newDiscount);
    return {
      statusCode: HttpStatus.CREATED,
      data: discount,
      message: 'The Discount was created',
    };
  }

  async update(id: number, userId: number, changes: UpdateDiscountDto) {
    const { data } = await this.findOne(id);
    this.repo.merge(data as Discount, {
      ...changes,
      updatedBy: { id: userId },
    });
    const rta = await this.repo.save(data as Discount);
    return {
      statusCode: HttpStatus.OK,
      data: rta,
      message: `The Discount with ID: ${id} has been modified`,
    };
  }

  async remove(id: Discount['id'], userId: number) {
    const { data } = await this.findOne(id);

    const changes = {
      isDeleted: true,
      deletedBy: { id: userId },
      deletedAt: new Date(),
    };
    this.repo.merge(data as Discount, changes);
    await this.repo.save(data as Discount);
    return {
      statusCode: HttpStatus.OK,
      message: `The Discount with ID: ${id} has been deleted`,
    };
  }
}
