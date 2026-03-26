import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';

/* Entities */
import { Purchase } from './entities/purchase.entity';
import { Supplier } from '@supplier/entities/supplier.entity';

/* DTO's */
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class PurchaseService
  implements IBaseService<Purchase, CreatePurchaseDto, UpdatePurchaseDto>
{
  constructor(
    @InjectRepository(Purchase)
    private readonly repo: Repository<Purchase>,
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
   * Retrieves a list of all active (non-deleted) purchases, sorted by purchaseDate.
   *
   * Supports optional pagination via PaginationDto.
   * When no pagination options are provided, all purchases are returned.
   *
   * @param paginationDto - Optional pagination parameters.
   * @returns {Promise<PaginatedResult<Purchase>>} A standardized paginated response.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<Purchase>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Determine sort field and order
    const sortBy = paginationDto?.sortBy || 'purchaseDate';
    const sortOrder = paginationDto?.sortOrder || 'DESC';

    // Execute query
    const [data, total] = await this.repo.findAndCount({
      where: {
        isDeleted: false,
      },
      relations: ['supplier', 'createdBy', 'updatedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Return paginated result
    return PaginationHelper.createPaginatedResult(data, total, page, limit);
  }

  async findOne(id: number) {
    const purchase = await this.repo.findOne({
      where: { id, isDeleted: false },
      relations: ['createdBy'],
    });

    if (!purchase) {
      throw new NotFoundException(`The Purchase with ID ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: purchase,
    };
  }

  async findBySupplierId(supplierId: number): Promise<Result<Purchase[]>> {
    const [purchases, total] = await this.repo.findAndCount({
      where: { supplier: { id: supplierId }, isDeleted: false },
      relations: ['createdBy'],
    });

    return {
      statusCode: HttpStatus.OK,
      data: purchases,
      total,
    };
  }

  async create(dto: CreatePurchaseDto, userId: number) {
    const suppliedId = dto.supplier;
    const newPurchase = this.repo.create({
      ...dto,
      supplier: { id: suppliedId } as Supplier,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const purchase = await this.repo.save(newPurchase);
    return {
      statusCode: HttpStatus.CREATED,
      data: purchase,
      message: 'The Purchase was created',
    };
  }

  async update(id: number, userId: number, changes: UpdatePurchaseDto) {
    const { data } = await this.findOne(id);
    const supplierId = changes.supplier;
    this.repo.merge(data, {
      ...changes,
      supplier: { id: supplierId },
      updatedBy: { id: userId },
    });
    const rta = await this.repo.save(data);
    return {
      statusCode: HttpStatus.OK,
      data: rta,
      message: `The Purchase with id: ${id} has been modified`,
    };
  }

  async remove(id: Purchase['id'], userId: number) {
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
      message: `The Purchase with id: ${id} has been deleted`,
    };
  }
}
