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
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
/**
 * Service class for managing Supplier entities.
 * Provides methods for CRUD operations, soft deletion, and querying suppliers.
 *
 * @implements {IBaseService<Supplier, CreateSupplierDto, UpdateSupplierDto>}
 */
export class SupplierService
  implements IBaseService<Supplier, CreateSupplierDto, UpdateSupplierDto>
{
  /**
   * Constructs a new SupplierService.
   *
   * @param repo - The TypeORM repository for Supplier entities.
   */
  constructor(
    @InjectRepository(Supplier)
    private readonly repo: Repository<Supplier>,
  ) {}

  /**
   * Counts all Supplier entities in the database, including deleted ones.
   *
   * @returns An object containing the HTTP status code and the total count of suppliers.
   */
  async countAll() {
    const total = await this.repo.count();
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Counts all Supplier entities that are not marked as deleted.
   *
   * @returns An object containing the HTTP status code and the total count of non-deleted suppliers.
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
   * Retrieves a list of all active (non-deleted) suppliers, sorted by name.
   *
   * Supports optional pagination and search via PaginationDto.
   * When no pagination options are provided, all suppliers are returned.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns {Promise<PaginatedResult<Supplier>>} A standardized paginated response.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<Supplier>> {
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
   * Finds a Supplier by its ID, including related createdBy and updatedBy entities.
   *
   * @param id - The ID of the Supplier to find.
   * @returns A Result object containing the HTTP status code and the found Supplier.
   * @throws NotFoundException if the Supplier is not found.
   */
  async findOne(id: Supplier['id']): Promise<Result<Supplier>> {
    const supplier = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!supplier) {
      throw new NotFoundException(`The Supplier with ID: ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: supplier,
    };
  }

  /**
   * Finds a Supplier by its name, including related createdBy and updatedBy entities.
   *
   * @param name - The name of the Supplier to find.
   * @returns A Result object containing the HTTP status code and the found Supplier.
   * @throws NotFoundException if the Supplier is not found.
   */
  async findOneByName(name: string): Promise<Result<Supplier>> {
    const supplier = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { name, isDeleted: false },
    });
    if (!supplier) {
      throw new NotFoundException(`The Supplier with NAME: ${name} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: supplier,
    };
  }

  /**
   * Creates a new Supplier entity.
   *
   * @param dto - The data transfer object containing the Supplier data to create.
   * @returns An object containing the HTTP status code, the created Supplier, and a success message.
   */
  async create(dto: CreateSupplierDto, userId: number) {
    const newSupplier = this.repo.create({
      ...dto,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const supplier = await this.repo.save(newSupplier);
    return {
      statusCode: HttpStatus.CREATED,
      data: supplier,
      message: 'The Supplier was created',
    };
  }
  /**
   * Updates an existing Supplier entity by its ID.
   *
   * @param id - The ID of the Supplier to update.
   * @param changes - The data transfer object containing the changes to apply.
   * @returns An object containing the HTTP status code, the updated Supplier, and a success message.
   * @throws NotFoundException if the Supplier is not found.
   */
  async update(id: number, userId: number, changes: UpdateSupplierDto) {
    const { data } = await this.findOne(id);
    this.repo.merge(data as Supplier, {
      ...changes,
      updatedBy: { id: userId },
    });
    const rta = await this.repo.save(data as Supplier);
    return {
      statusCode: HttpStatus.OK,
      data: rta,
      message: `The Supplier with ID: ${id} has been modified`,
    };
  }

  /**
   * Soft deletes a Supplier entity by its ID by setting its isDeleted flag to true.
   *
   * @param id - The ID of the Supplier to delete.
   * @returns An object containing the HTTP status code and a success message.
   * @throws NotFoundException if the Supplier is not found.
   */
  async remove(id: Supplier['id'], userId: number) {
    const { data } = await this.findOne(id);

    const changes = { isDeleted: true };
    this.repo.merge(data as Supplier, {
      ...changes,
      deletedBy: { id: userId },
    });
    await this.repo.save(data as Supplier);
    return {
      statusCode: HttpStatus.OK,
      message: `The Supplier with ID: ${id} has been deleted`,
    };
  }
}
