/**
 * @fileoverview PaymentMethodService - Service for payment method business logic
 *
 * Handles all business operations for payment method management including
 * CRUD operations, pagination, and search.
 *
 * @module PaymentMethodService
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
import { PaymentMethod } from '@payment_method/entities/payment-method.entity';

/* DTO's */
import { CreatePaymentMethodDto } from '@payment_method/dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from '@payment_method/dto/update-payment-method.dto';
import { ResponsePaymentMethodDto } from '@payment_method/dto/response-payment-method.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

/* Mappers */
import {
  mapPaymentMethodToResponseDto,
  mapPaymentMethodsToResponseDto,
} from './mappers/payment-method.mapper';

/**
 * Service for managing payment method operations.
 *
 * @description
 * Provides business logic for:
 * - Counting all and active payment methods
 * - Listing payment methods with pagination, search, and sorting
 * - Finding payment methods by ID
 * - Creating, updating, and soft-deleting payment methods
 *
 * All public methods return ResponsePaymentMethodDto for consistent API responses.
 */
@Injectable()
export class PaymentMethodService
  implements
    IBaseService<
      ResponsePaymentMethodDto,
      CreatePaymentMethodDto,
      UpdatePaymentMethodDto
    >
{
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly repo: Repository<PaymentMethod>,
  ) {}

  /**
   * Counts all payment methods in the system (including deleted).
   *
   * @returns Promise resolving to an object with statusCode and total count
   *
   * @example
   * const result = await paymentMethodService.countAll();
   * // Returns: { statusCode: 200, total: 15 }
   */
  async countAll(): Promise<Result<number>> {
    const total = await this.repo.count();
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Counts all active (non-deleted) payment methods in the system.
   *
   * @returns Promise resolving to an object with statusCode and total count
   *
   * @example
   * const result = await paymentMethodService.count();
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
   * Retrieves a paginated list of active payment methods with optional search and sorting.
   *
   * @param paginationDto - Optional pagination parameters (page, limit, search, sortBy, sortOrder)
   * @returns Promise resolving to a paginated result containing an array of ResponsePaymentMethodDto
   *
   * @example
   * // Get first page with 10 items
   * const result = await paymentMethodService.findAll({ page: 1, limit: 10 });
   *
   * @example
   * // Search and sort
   * const result = await paymentMethodService.findAll({
   *   search: 'card',
   *   sortBy: 'name',
   *   sortOrder: 'ASC'
   * });
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<ResponsePaymentMethodDto>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<PaymentMethod> = {
      isDeleted: false,
    };

    // Build search conditions for name
    const searchConditions: FindOptionsWhere<PaymentMethod>[] = [];
    if (paginationDto?.search) {
      const searchTerm = `%${paginationDto.search}%`;
      searchConditions.push({ ...where, name: ILike(searchTerm) });
    }

    // Determine sort field and order
    const sortBy = paginationDto?.sortBy || 'name';
    const sortOrder = paginationDto?.sortOrder || 'ASC';

    // Execute query with relations
    const [paymentMethods, total] = await this.repo.findAndCount({
      where: searchConditions.length > 0 ? searchConditions : where,
      relations: ['createdBy', 'updatedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Map to DTO and return paginated result
    const data = mapPaymentMethodsToResponseDto(paymentMethods);
    return PaginationHelper.createPaginatedResult(data, total, page, limit);
  }

  /**
   * Finds a single payment method by its ID.
   *
   * @param id - The unique identifier of the payment method
   * @returns Promise resolving to a Result containing the ResponsePaymentMethodDto
   * @throws NotFoundException if payment method is not found or is deleted
   *
   * @example
   * const result = await paymentMethodService.findOne(1);
   * // Returns: { statusCode: 200, data: { id: 1, name: 'Credit Card', ... } }
   */
  async findOne(
    id: PaymentMethod['id'],
  ): Promise<Result<ResponsePaymentMethodDto>> {
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
      data: mapPaymentMethodToResponseDto(paymentMethod),
    };
  }

  /**
   * Creates a new payment method.
   *
   * @param dto - CreatePaymentMethodDto containing the payment method data
   * @param userId - ID of the user creating the payment method
   * @returns Promise resolving to a Result containing the created ResponsePaymentMethodDto
   *
   * @example
   * const result = await paymentMethodService.create(
   *   { name: 'PayPal' },
   *   1
   * );
   * // Returns: { statusCode: 201, data: { ... }, message: 'The Payment Method was created' }
   */
  async create(
    dto: CreatePaymentMethodDto,
    userId: number,
  ): Promise<Result<ResponsePaymentMethodDto>> {
    // Create new payment method entity
    const newPaymentMethod = this.repo.create({
      ...dto,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });

    const paymentMethod = await this.repo.save(newPaymentMethod);

    // Fetch with relations for proper mapping
    const savedPaymentMethod = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id: paymentMethod.id },
    });

    return {
      statusCode: HttpStatus.CREATED,
      data: mapPaymentMethodToResponseDto(savedPaymentMethod!),
      message: 'The Payment Method was created',
    };
  }

  /**
   * Updates an existing payment method.
   *
   * @param id - ID of the payment method to update
   * @param userId - ID of the user performing the update
   * @param changes - UpdatePaymentMethodDto containing the fields to update
   * @returns Promise resolving to a Result containing the updated ResponsePaymentMethodDto
   * @throws NotFoundException if payment method is not found
   *
   * @example
   * const result = await paymentMethodService.update(1, 1, { name: 'New Name' });
   * // Returns: { statusCode: 200, data: { ... }, message: 'The Payment Method with ID: 1 has been modified' }
   */
  async update(
    id: number,
    userId: number,
    changes: UpdatePaymentMethodDto,
  ): Promise<Result<ResponsePaymentMethodDto>> {
    const paymentMethodEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!paymentMethodEntity) {
      throw new NotFoundException(
        `The Payment Method with ID: ${id} not found`,
      );
    }

    // Merge changes and update
    this.repo.merge(paymentMethodEntity, {
      ...changes,
      updatedBy: { id: userId },
    });

    const savedPaymentMethod = await this.repo.save(paymentMethodEntity);

    // Fetch with relations for proper mapping
    const updatedPaymentMethod = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id: savedPaymentMethod.id },
    });

    return {
      statusCode: HttpStatus.OK,
      data: mapPaymentMethodToResponseDto(updatedPaymentMethod!),
      message: `The Payment Method with ID: ${id} has been modified`,
    };
  }

  /**
   * Soft deletes a payment method by marking it as deleted.
   *
   * @param id - ID of the payment method to delete
   * @param userId - ID of the user performing the deletion
   * @returns Promise resolving to an object with statusCode and message
   * @throws NotFoundException if payment method is not found
   *
   * @example
   * const result = await paymentMethodService.remove(1, 1);
   * // Returns: { statusCode: 200, message: 'The Payment Method with ID: 1 has been deleted' }
   */
  async remove(
    id: PaymentMethod['id'],
    userId: number,
  ): Promise<{ statusCode: number; message: string }> {
    const paymentMethodEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!paymentMethodEntity) {
      throw new NotFoundException(
        `The Payment Method with ID: ${id} not found`,
      );
    }

    // Soft delete by marking as deleted
    const changes = {
      isDeleted: true,
      deletedBy: { id: userId },
    };
    this.repo.merge(paymentMethodEntity, changes);
    await this.repo.save(paymentMethodEntity);

    return {
      statusCode: HttpStatus.OK,
      message: `The Payment Method with ID: ${id} has been deleted`,
    };
  }
}
