import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';

/* Entities */
import { Purchase } from './entities/purchase.entity';
import { Supplier } from '@supplier/entities/supplier.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { ResponsePurchaseDto } from './dto/response-purchase.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

/* Mappers */
import {
  mapPurchaseToResponseDto,
  mapPurchasesToResponseDto,
} from './mappers/purchase.mapper';

@Injectable()
export class PurchaseService
  implements
    IBaseService<ResponsePurchaseDto, CreatePurchaseDto, UpdatePurchaseDto>
{
  constructor(
    @InjectRepository(Purchase)
    private readonly repo: Repository<Purchase>,
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
   * Retrieves a list of all active (non-deleted) purchases, sorted by purchaseDate.
   *
   * Supports optional pagination via PaginationDto.
   * When no pagination options are provided, all purchases are returned.
   *
   * @param paginationDto - Optional pagination parameters.
   * @returns {Promise<PaginatedResult<ResponsePurchaseDto>>} A standardized paginated response.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<ResponsePurchaseDto>> {
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

    // Map to DTO and return paginated result
    const mappedData = mapPurchasesToResponseDto(data);
    return PaginationHelper.createPaginatedResult(
      mappedData,
      total,
      page,
      limit,
    );
  }

  async findOne(id: number): Promise<Result<ResponsePurchaseDto>> {
    const purchase = await this.repo.findOne({
      where: { id, isDeleted: false },
      relations: [
        'createdBy',
        'updatedBy',
        'purchaseDetails',
        'purchaseDetails.product',
      ],
    });

    if (!purchase) {
      throw new NotFoundException(`The Purchase with ID ${id} not found`);
    }

    return {
      statusCode: HttpStatus.OK,
      data: mapPurchaseToResponseDto(purchase, true),
    };
  }

  async create(
    dto: CreatePurchaseDto,
    userId: number,
  ): Promise<Result<ResponsePurchaseDto>> {
    const suppliedId = dto.supplier;
    const newPurchase = this.repo.create({
      ...dto,
      supplier: { id: suppliedId } as Supplier,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const purchase = await this.repo.save(newPurchase);

    // Fetch with relations for proper mapping
    const savedPurchase = await this.repo.findOne({
      relations: ['supplier', 'createdBy', 'updatedBy'],
      where: { id: purchase.id },
    });

    return {
      statusCode: HttpStatus.CREATED,
      data: mapPurchaseToResponseDto(savedPurchase!),
      message: 'The Purchase was created',
    };
  }

  async update(
    id: number,
    userId: number,
    changes: UpdatePurchaseDto,
  ): Promise<Result<ResponsePurchaseDto>> {
    const purchaseEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!purchaseEntity) {
      throw new NotFoundException(`The Purchase with ID ${id} not found`);
    }

    // Build update data - handle supplier separately to avoid type conflict
    const { supplier: _supplier, ...restChanges } = changes as {
      supplier?: number;
      purchaseDate?: Date;
      totalAmount?: number;
    };

    void _supplier;

    const updateData: Partial<Purchase> = {
      ...restChanges,
      updatedBy: { id: userId } as User,
    };

    if (changes.supplier !== undefined) {
      updateData.supplier = { id: changes.supplier } as Supplier;
    }

    this.repo.merge(purchaseEntity, updateData);
    const savedPurchase = await this.repo.save(purchaseEntity);

    // Fetch with relations for proper mapping
    const updatedPurchase = await this.repo.findOne({
      relations: ['supplier', 'createdBy', 'updatedBy'],
      where: { id: savedPurchase.id },
    });

    return {
      statusCode: HttpStatus.OK,
      data: mapPurchaseToResponseDto(updatedPurchase!),
      message: `The Purchase with id: ${id} has been modified`,
    };
  }

  async remove(
    id: Purchase['id'],
    userId: number,
  ): Promise<{ statusCode: number; message: string }> {
    const purchaseEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!purchaseEntity) {
      throw new NotFoundException(`The Purchase with ID ${id} not found`);
    }

    const changes = {
      isDeleted: true,
      deletedBy: { id: userId },
      deletedAt: new Date(),
    };
    this.repo.merge(purchaseEntity, changes);
    await this.repo.save(purchaseEntity);

    return {
      statusCode: HttpStatus.OK,
      message: `The Purchase with id: ${id} has been deleted`,
    };
  }
}
