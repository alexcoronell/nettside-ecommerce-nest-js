import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';

/* Entities */
import { PaymentMethod } from '@payment_method/entities/payment-method.entity';

/* DTO's */
import { CreatePaymentMethodDto } from '@payment_method/dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from '@payment_method/dto/update-payment-method.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
/**
 * Service for managing PaymentMethod entities.
 *
 * Provides CRUD operations and utility methods for PaymentMethod, including
 * soft deletion, counting, and retrieval by name or ID.
 *
 * @implements IBaseService<PaymentMethod, CreatePaymentMethodDto, UpdatePaymentMethodDto>
 */
export class PaymentMethodService
  implements
    IBaseService<PaymentMethod, CreatePaymentMethodDto, UpdatePaymentMethodDto>
{
  /**
   * Constructs a new PaymentMethodService.
   *
   * @param repo - The repository instance for PaymentMethod entity.
   */
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly repo: Repository<PaymentMethod>,
  ) {}

  /**
   * Counts all PaymentMethod records, including deleted ones.
   *
   * @returns An object containing the total count and HTTP status code.
   */
  async countAll() {
    const total = await this.repo.count();
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Counts all PaymentMethod records that are not marked as deleted.
   *
   * @returns An object containing the total count and HTTP status code.
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
   * Retrieves a list of all active (non-deleted) payment methods, sorted by name.
   *
   * Supports optional pagination and search via PaginationDto.
   * When no pagination options are provided, all payment methods are returned.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns {Promise<PaginatedResult<PaymentMethod>>} A standardized paginated response.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<PaymentMethod>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<PaymentMethod> = {
      isDeleted: false,
    };

    // Build search conditions
    const searchConditions: FindOptionsWhere<PaymentMethod>[] = [];
    if (paginationDto?.search) {
      const searchTerm = `%${paginationDto.search}%`;
      searchConditions.push({ ...where, name: ILike(searchTerm) });
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
   * Finds a PaymentMethod by its ID, including related createdBy and updatedBy entities.
   * Throws NotFoundException if not found or marked as deleted.
   *
   * @param id - The ID of the PaymentMethod to retrieve.
   * @returns A result object containing the PaymentMethod and HTTP status code.
   * @throws NotFoundException if the PaymentMethod is not found.
   */
  async findOne(id: PaymentMethod['id']): Promise<Result<PaymentMethod>> {
    const paymentMethod = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!paymentMethod) {
      throw new NotFoundException(
        `The Payment Method with ID: ${id} not found`,
      );
    }
    return {
      statusCode: HttpStatus.OK,
      data: paymentMethod,
    };
  }

  /**
   * Creates a new PaymentMethod entity.
   *
   * @param dto - The data transfer object containing creation data.
   * @returns An object containing the created PaymentMethod, HTTP status code, and a message.
   */
  async create(dto: CreatePaymentMethodDto, userId: number) {
    const newPaymentMethod = this.repo.create({
      ...dto,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const paymentMethod = await this.repo.save(newPaymentMethod);
    return {
      statusCode: HttpStatus.CREATED,
      data: paymentMethod,
      message: 'The Payment Method was created',
    };
  }

  /**
   * Updates an existing PaymentMethod entity by its ID.
   *
   * @param id - The ID of the PaymentMethod to update.
   * @param changes - The data transfer object containing update data.
   * @returns An object containing the updated PaymentMethod, HTTP status code, and a message.
   */
  async update(id: number, userId: number, changes: UpdatePaymentMethodDto) {
    const { data } = await this.findOne(id);
    this.repo.merge(data as PaymentMethod, {
      ...changes,
      updatedBy: { id: userId },
    });
    const rta = await this.repo.save(data as PaymentMethod);
    return {
      statusCode: HttpStatus.OK,
      data: rta,
      message: `The Payment Method with ID: ${id} has been modified`,
    };
  }

  /**
   * Soft deletes a PaymentMethod entity by its ID by setting isDeleted to true.
   *
   * @param id - The ID of the PaymentMethod to delete.
   * @returns An object containing HTTP status code and a message.
   */
  async remove(id: PaymentMethod['id'], userId: number) {
    const { data } = await this.findOne(id);

    const changes = { isDeleted: true };
    this.repo.merge(data as PaymentMethod, {
      ...changes,
      deletedBy: { id: userId },
    });
    await this.repo.save(data as PaymentMethod);
    return {
      statusCode: HttpStatus.OK,
      message: `The Payment Method with ID: ${id} has been deleted`,
    };
  }
}
