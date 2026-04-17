import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';

/* Entities */
import { ShippingCompany } from './entities/shipping-company.entity';

/* DTO's */
import { CreateShippingCompanyDto } from './dto/create-shipping-company.dto';
import { UpdateShippingCompanyDto } from './dto/update-shipping-company.dto';
import { ResponseShippingCompanyDto } from './dto/response-shipping-company.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class ShippingCompanyService
  implements
    IBaseService<
      ResponseShippingCompanyDto,
      CreateShippingCompanyDto,
      UpdateShippingCompanyDto
    >
{
  constructor(
    @InjectRepository(ShippingCompany)
    private readonly repo: Repository<ShippingCompany>,
  ) {}

  /**
   * Maps a ShippingCompany entity to ResponseShippingCompanyDto.
   */
  mapEntityToResponse(entity: ShippingCompany): ResponseShippingCompanyDto {
    return {
      id: entity.id,
      name: entity.name,
      contactName: entity.contactName,
      phoneNumber: entity.phoneNumber,
      email: entity.email,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
      deletedBy: entity.deletedBy?.id ?? null,
      createdBy: entity.createdBy?.id ?? null,
      updatedBy: entity.updatedBy?.id ?? null,
    };
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
   * Retrieves a list of all active (non-deleted) shipping companies, sorted by name.
   *
   * Supports optional pagination and search via PaginationDto.
   * When no pagination options are provided, all shipping companies are returned.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns {Promise<PaginatedResult<ShippingCompany>>} A standardized paginated response.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<ResponseShippingCompanyDto>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<ShippingCompany> = {
      isDeleted: false,
    };

    // Build search conditions
    const searchConditions: FindOptionsWhere<ShippingCompany>[] = [];
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
      relations: ['createdBy', 'updatedBy', 'deletedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Map to response DTO
    const mappedData = data.map((entity) => this.mapEntityToResponse(entity));

    // Return paginated result
    return PaginationHelper.createPaginatedResult(
      mappedData,
      total,
      page,
      limit,
    );
  }

  async findOne(
    id: ShippingCompany['id'],
  ): Promise<Result<ResponseShippingCompanyDto>> {
    const data = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy', 'deletedBy'],
      where: { id, isDeleted: false },
    });
    if (!data) {
      throw new NotFoundException(
        `The Shipping Company with ID: ${id} not found`,
      );
    }
    return {
      statusCode: HttpStatus.OK,
      data: this.mapEntityToResponse(data),
    };
  }

  async create(
    dto: CreateShippingCompanyDto,
    userId: number,
  ): Promise<Result<ResponseShippingCompanyDto>> {
    const newItem = this.repo.create({
      ...dto,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const saved = await this.repo.save(newItem);
    // Fetch with relations for mapping
    const data = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id: saved.id },
    });
    return {
      statusCode: HttpStatus.CREATED,
      data: this.mapEntityToResponse(data!),
      message: 'The Shipping Company was created',
    };
  }

  async update(
    id: number,
    userId: number,
    changes: UpdateShippingCompanyDto,
  ): Promise<Result<ResponseShippingCompanyDto>> {
    const data = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!data) {
      throw new NotFoundException(
        `The Shipping Company with ID: ${id} not found`,
      );
    }
    this.repo.merge(data, {
      ...changes,
      updatedBy: { id: userId },
    });
    const saved = await this.repo.save(data);
    return {
      statusCode: HttpStatus.OK,
      data: this.mapEntityToResponse(saved),
      message: `The Shipping Company with ID: ${id} has been modified`,
    };
  }

  async remove(
    id: ShippingCompany['id'],
    userId: number,
  ): Promise<{ statusCode: number; message: string }> {
    const data = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!data) {
      throw new NotFoundException(
        `The Shipping Company with ID: ${id} not found`,
      );
    }
    this.repo.merge(data, {
      isDeleted: true,
      deletedBy: { id: userId },
      deletedAt: new Date(),
    });
    await this.repo.save(data);
    return {
      statusCode: HttpStatus.OK,
      message: `The Shipping Company with ID: ${id} has been deleted`,
    };
  }
}
