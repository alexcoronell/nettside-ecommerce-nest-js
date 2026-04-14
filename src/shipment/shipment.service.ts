import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';

/* Entities */
import { Sale } from '@sale/entities/sale.entity';
import { Shipment } from './entities/shipment.entity';
import { ShippingCompany } from '@shipping_company/entities/shipping-company.entity';

/* DTO's */
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class ShipmentService
  implements IBaseService<Shipment, CreateShipmentDto, UpdateShipmentDto>
{
  constructor(
    @InjectRepository(Shipment)
    private readonly repo: Repository<Shipment>,
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
   * Retrieves a list of all active (non-deleted) shipments, sorted by shipmentDate.
   *
   * Supports optional pagination and search via PaginationDto.
   * When no pagination options are provided, all shipments are returned.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns {Promise<PaginatedResult<Shipment>>} A standardized paginated response.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<Shipment>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<Shipment> = {
      isDeleted: false,
    };

    // Build search conditions
    const searchConditions: FindOptionsWhere<Shipment>[] = [];
    if (paginationDto?.search) {
      const searchTerm = `%${paginationDto.search}%`;
      searchConditions.push({ ...where, trackingNumber: ILike(searchTerm) });
    }

    // Determine sort field and order
    const sortBy = paginationDto?.sortBy || 'shipmentDate';
    const sortOrder = paginationDto?.sortOrder || 'DESC';

    // Execute query
    const [data, total] = await this.repo.findAndCount({
      where: searchConditions.length > 0 ? searchConditions : where,
      relations: ['sale', 'shippingCompany', 'createdBy', 'updatedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Return paginated result
    return PaginationHelper.createPaginatedResult(data, total, page, limit);
  }

  async findAllByShippingCompanyId(
    id: ShippingCompany['id'],
  ): Promise<Result<Shipment[]>> {
    const shipments = await this.repo.find({
      relations: ['sale', 'shippingCompany', 'createdBy', 'updatedBy'],
      where: { shippingCompany: { id }, isDeleted: false },
    });
    return {
      statusCode: HttpStatus.OK,
      data: shipments,
    };
  }

  async findOne(id: Shipment['id']): Promise<Result<Shipment>> {
    const shipment = await this.repo.findOne({
      relations: ['sale', 'shippingCompany', 'createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!shipment) {
      throw new NotFoundException(`The Shipment with ID: ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: shipment,
    };
  }

  async findOneByTrackingNumber(
    trackingNumber: string,
  ): Promise<Result<Shipment>> {
    const shipment = await this.repo.findOne({
      relations: ['sale', 'shippingCompany', 'createdBy', 'updatedBy'],
      where: { trackingNumber, isDeleted: false },
    });
    if (!shipment) {
      throw new NotFoundException(
        `The Shipment with tracking number: ${trackingNumber} not found`,
      );
    }
    return {
      statusCode: HttpStatus.OK,
      data: shipment,
    };
  }

  async findOneBySaleId(id: Sale['id']): Promise<Result<Shipment>> {
    const shipment = await this.repo.findOne({
      relations: ['sale', 'shippingCompany', 'createdBy', 'updatedBy'],
      where: { sale: { id }, isDeleted: false },
    });
    if (!shipment) {
      throw new NotFoundException(`The Shipment with sale ID: ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: shipment,
    };
  }

  async create(dto: CreateShipmentDto, userId: number) {
    const saleId = dto.sale;
    const shippingCompanyId = dto.shippingCompany;

    const shipment = this.repo.create({
      ...dto,
      createdBy: { id: userId },
      updatedBy: { id: userId },
      sale: { id: saleId },
      shippingCompany: { id: shippingCompanyId },
    });

    const data = await this.repo.save(shipment);

    return {
      statusCode: HttpStatus.CREATED,
      data,
      message: 'The Shipment was created',
    };
  }

  async update(id: Shipment['id'], userId: number, changes: UpdateShipmentDto) {
    const { data } = await this.findOne(id);
    const saleId = changes.sale;
    const shippingCompanyId = changes.shippingCompany;
    this.repo.merge(data as Shipment, {
      ...changes,
      updatedBy: { id: userId },
      sale: { id: saleId } as Sale,
      shippingCompany: { id: shippingCompanyId } as ShippingCompany,
    });
    const rta = await this.repo.save(data as Shipment);
    return {
      statusCode: HttpStatus.OK,
      data: rta,
      message: `The Shipment with id: ${id} has been modified`,
    };
  }

  async remove(id: Shipment['id'], userId: number) {
    const { data } = await this.findOne(id);

    const changes = {
      isDeleted: true,
      deletedBY: { id: userId },
      deletedAt: new Date(),
    };
    this.repo.merge(data as Shipment, changes);
    await this.repo.save(data as Shipment);
    return {
      statusCode: HttpStatus.OK,
      message: `The Shipment with ID: ${id} has been deleted`,
    };
  }
}
