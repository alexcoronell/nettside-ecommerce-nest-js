/**
 * @fileoverview SupplierService - Service for supplier business logic
 *
 * Handles all business operations for supplier management including
 * CRUD operations, pagination, and search.
 *
 * @module SupplierService
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';

/* Entities */
import { Supplier } from '@supplier/entities/supplier.entity';

/* DTO's */
import { CreateSupplierDto } from '@supplier/dto/create-supplier.dto';
import { UpdateSupplierDto } from '@supplier/dto/update-supplier.dto';
import { ResponseSupplierDto } from '@supplier/dto/response-supplier.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Mappers */
import {
  mapSupplierToResponseDto,
  mapSuppliersToResponseDto,
} from './mappers/supplier.mapper';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class SupplierService
  implements
    IBaseService<ResponseSupplierDto, CreateSupplierDto, UpdateSupplierDto>
{
  constructor(
    @InjectRepository(Supplier)
    private readonly repo: Repository<Supplier>,
  ) {}

  /**
   * Counts all active (non-deleted) suppliers in the system.
   *
   * @returns Promise resolving to an object with statusCode and total count
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
   * Retrieves a paginated list of active suppliers with optional search and sorting.
   *
   * @param paginationDto - Optional pagination parameters (page, limit, search, sortBy, sortOrder)
   * @returns Promise resolving to a paginated result containing an array of ResponseSupplierDto
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<ResponseSupplierDto>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<Supplier> = {
      isDeleted: false,
    };

    // Build search conditions
    const searchConditions: FindOptionsWhere<Supplier>[] = [];
    if (paginationDto?.search) {
      const searchTerm = `%${paginationDto.search}%`;
      searchConditions.push(
        { ...where, name: ILike(searchTerm) },
        { ...where, contactName: ILike(searchTerm) },
        { ...where, email: ILike(searchTerm) },
        { ...where, phoneNumber: ILike(searchTerm) },
      );
    }

    // Determine sort field and order
    const sortBy = paginationDto?.sortBy || 'name';
    const sortOrder = paginationDto?.sortOrder || 'ASC';

    // Execute query
    const [suppliers, total] = await this.repo.findAndCount({
      where: searchConditions.length > 0 ? searchConditions : where,
      relations: ['createdBy', 'updatedBy', 'deletedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Return paginated result using mapper
    return PaginationHelper.createPaginatedResult(
      mapSuppliersToResponseDto(suppliers),
      total,
      page,
      limit,
    );
  }

  /**
   * Finds a supplier entity by ID for internal use (update, remove, etc).
   * Does NOT use mapper - returns the raw entity.
   *
   * @param id - The ID of the supplier to retrieve.
   * @returns Promise resolving to the raw Supplier entity.
   * @throws NotFoundException if supplier is not found or is deleted
   */
  private async findOneEntity(id: Supplier['id']): Promise<Supplier> {
    const supplier = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy', 'deletedBy'],
      where: { id, isDeleted: false },
    });
    if (!supplier) {
      throw new NotFoundException(`The Supplier with ID: ${id} not found`);
    }
    return supplier;
  }

  /**
   * Retrieves a single supplier by its ID.
   *
   * @param id - The unique identifier of the supplier
   * @returns Promise resolving to a Result containing the ResponseSupplierDto
   * @throws NotFoundException if supplier is not found
   */
  async findOne(id: Supplier['id']): Promise<Result<ResponseSupplierDto>> {
    const supplier = await this.findOneEntity(id);
    return {
      statusCode: HttpStatus.OK,
      data: mapSupplierToResponseDto(supplier),
    };
  }

  /**
   * Creates a new supplier.
   *
   * @param dto - CreateSupplierDto containing the supplier data
   * @param userId - ID of the user creating the supplier
   * @returns Promise resolving to a Result containing the created ResponseSupplierDto
   */
  async create(
    dto: CreateSupplierDto,
    userId: number,
  ): Promise<Result<ResponseSupplierDto>> {
    const newSupplier = this.repo.create({
      ...dto,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const supplier = await this.repo.save(newSupplier);

    // Fetch with relations for proper mapping
    const savedSupplier = await this.repo.findOne({
      where: { id: supplier.id },
      relations: ['createdBy', 'updatedBy', 'deletedBy'],
    });

    return {
      statusCode: HttpStatus.CREATED,
      data: mapSupplierToResponseDto(savedSupplier!),
      message: 'The Supplier was created',
    };
  }

  /**
   * Updates an existing supplier.
   *
   * @param id - ID of the supplier to update
   * @param userId - ID of the user performing the update
   * @param changes - UpdateSupplierDto containing the fields to update
   * @returns Promise resolving to a Result containing the updated ResponseSupplierDto
   * @throws NotFoundException if supplier is not found
   */
  async update(
    id: number,
    userId: number,
    changes: UpdateSupplierDto,
  ): Promise<Result<ResponseSupplierDto>> {
    const supplier = await this.findOneEntity(id);
    this.repo.merge(supplier, { ...changes, updatedBy: { id: userId } });
    const updatedSupplier = await this.repo.save(supplier);

    // Fetch with relations for proper mapping
    const savedSupplier = await this.repo.findOne({
      where: { id: updatedSupplier.id },
      relations: ['createdBy', 'updatedBy', 'deletedBy'],
    });

    return {
      statusCode: HttpStatus.OK,
      data: mapSupplierToResponseDto(savedSupplier!),
      message: `The Supplier with ID: ${id} has been modified`,
    };
  }

  /**
   * Soft deletes a supplier by marking it as deleted.
   *
   * @param id - ID of the supplier to delete
   * @param userId - ID of the user performing the deletion
   * @returns Promise resolving to an object with statusCode and message
   * @throws NotFoundException if supplier is not found
   */
  async remove(id: Supplier['id'], userId: number) {
    const supplier = await this.findOneEntity(id);

    const changes = {
      deletedBy: { id: userId },
      isDeleted: true,
    };

    this.repo.merge(supplier, changes);
    await this.repo.save(supplier);
    return {
      statusCode: HttpStatus.OK,
      message: `The Supplier with ID: ${id} has been deleted`,
    };
  }
}
