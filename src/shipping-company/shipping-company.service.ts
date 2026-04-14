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
      ShippingCompany,
      CreateShippingCompanyDto,
      UpdateShippingCompanyDto
    >
{
  constructor(
    @InjectRepository(ShippingCompany)
    private readonly repo: Repository<ShippingCompany>,
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
  ): Promise<PaginatedResult<ShippingCompany>> {
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

  async findOne(id: ShippingCompany['id']): Promise<Result<ShippingCompany>> {
    const data = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!data) {
      throw new NotFoundException(
        `The Shipping Company with ID: ${id} not found`,
      );
    }
    return {
      statusCode: HttpStatus.OK,
      data: data,
    };
  }

  async findOneByName(name: string): Promise<Result<ShippingCompany>> {
    const data = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { name, isDeleted: false },
    });
    if (!data) {
      throw new NotFoundException(
        `The Shipping Company with NAME: ${name} not found`,
      );
    }
    return {
      statusCode: HttpStatus.OK,
      data: data,
    };
  }

  async create(dto: CreateShippingCompanyDto, userId: number) {
    const newItem = this.repo.create({
      ...dto,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const data = await this.repo.save(newItem);
    return {
      statusCode: HttpStatus.CREATED,
      data,
      message: 'The Shipping Company was created',
    };
  }

  async update(id: number, userId: number, changes: UpdateShippingCompanyDto) {
    const { data } = await this.findOne(id);
    this.repo.merge(data as ShippingCompany, {
      ...changes,
      updatedBy: { id: userId },
    });
    const rta = await this.repo.save(data as ShippingCompany);
    return {
      statusCode: HttpStatus.OK,
      data: rta,
      message: `The Shipping Company with ID: ${id} has been modified`,
    };
  }

  async remove(id: ShippingCompany['id'], userId: number) {
    const { data } = await this.findOne(id);

    const changes = { isDeleted: true };
    this.repo.merge(data as ShippingCompany, {
      ...changes,
      deletedBy: { id: userId },
      deletedAt: new Date(),
    });
    await this.repo.save(data as ShippingCompany);
    return {
      statusCode: HttpStatus.OK,
      message: `The Shipping Company with ID: ${id} has been deleted`,
    };
  }
}
