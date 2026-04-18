/**
 * @fileoverview Sale Service
 *
 * Business logic for Sale operations.
 * Uses mapper pattern to return ResponseSaleDto instead of raw entities.
 * Follows Interface Segregation Principle.
 *
 * @module SaleService
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Entities */
import { Sale } from './entities/sale.entity';

/* DTOS's */
import { CreateSaleDto } from './dto/create-sale.dto';
import { ResponseSaleDto } from './dto/response-sale.dto';

/* Mapper */
import {
  mapSaleToResponseDto,
  mapSalesToResponseDto,
} from './mappers/sale.mapper';

/* Types */
import { Result } from '@commons/types/result.type';
import { PaymentMethod } from '@payment_method/entities/payment-method.entity';
import { User } from '@user/entities/user.entity';
import { SaleStatusEnum } from '@commons/enums/sale-status.enum';

/**
 * Service for managing sales.
 *
 * @example
 * constructor(private readonly saleService: SaleService) {}
 */
@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) {}

  /**
   * Counts all sales in the database (including cancelled).
   *
   * @returns Object with status code and total count
   */
  async countAll(): Promise<{ statusCode: number; total: number }> {
    const total = await this.saleRepository.count();
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Counts only active (non-cancelled) sales.
   *
   * @returns Object with status code and total count
   */
  async count(): Promise<{ statusCode: number; total: number }> {
    const total = await this.saleRepository.count({
      where: {
        isCancelled: false,
      },
    });
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Finds all active (non-cancelled) sales.
   *
   * @returns Result with array of ResponseSaleDto
   */
  async findAll(): Promise<Result<ResponseSaleDto[]>> {
    const [sales, total] = await this.saleRepository.findAndCount({
      where: {
        isCancelled: false,
      },
      relations: ['user', 'paymentMethod'],
      order: {
        saleDate: 'DESC',
      },
    });
    return {
      statusCode: HttpStatus.OK,
      data: mapSalesToResponseDto(sales),
      total,
    };
  }

  /**
   * Finds all sales for a specific user.
   *
   * @param userId - The ID of the user
   * @returns Result with array of ResponseSaleDto
   */
  async findAllByUser(userId: number): Promise<Result<ResponseSaleDto[]>> {
    const [sales, total] = await this.saleRepository.findAndCount({
      where: {
        user: { id: userId },
        isCancelled: false,
      },
      relations: ['user', 'paymentMethod'],
      order: {
        saleDate: 'DESC',
      },
    });
    return {
      statusCode: HttpStatus.OK,
      data: mapSalesToResponseDto(sales),
      total,
    };
  }

  /**
   * Finds all sales for a specific payment method.
   *
   * @param paymentMethodId - The ID of the payment method
   * @returns Result with array of ResponseSaleDto
   */
  async findAllByPaymentMethod(
    paymentMethodId: number,
  ): Promise<Result<ResponseSaleDto[]>> {
    const [sales, total] = await this.saleRepository.findAndCount({
      where: {
        paymentMethod: { id: paymentMethodId },
        isCancelled: false,
      },
      relations: ['user', 'paymentMethod'],
      order: {
        saleDate: 'DESC',
      },
    });

    return {
      statusCode: HttpStatus.OK,
      data: mapSalesToResponseDto(sales),
      total,
    };
  }

  /**
   * Finds a single sale by ID.
   *
   * @param id - The sale ID
   * @returns Result with single ResponseSaleDto
   * @throws NotFoundException if sale not found
   */
  async findOne(id: Sale['id']): Promise<Result<ResponseSaleDto>> {
    const sale = await this.saleRepository.findOne({
      where: { id, isCancelled: false },
      relations: ['user', 'paymentMethod'],
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return { statusCode: HttpStatus.OK, data: mapSaleToResponseDto(sale) };
  }

  /**
   * Creates a new sale.
   *
   * @param dto - The create sale DTO
   * @param userId - The user ID (from cookie)
   * @returns Result with created ResponseSaleDto
   */
  async create(
    dto: CreateSaleDto,
    userId: number,
  ): Promise<Result<ResponseSaleDto>> {
    const paymentMethodId = dto.paymentMethod;
    const newSale = this.saleRepository.create({
      ...dto,
      paymentMethod: { id: paymentMethodId } as PaymentMethod,
      user: { id: userId } as User,
      status: SaleStatusEnum.PENDING_PAYMENT,
    });
    const savedSale = await this.saleRepository.save(newSale);

    // Reload with relations for response
    const saleWithRelations = await this.saleRepository.findOne({
      where: { id: savedSale.id },
      relations: ['user', 'paymentMethod'],
    });

    return {
      statusCode: HttpStatus.CREATED,
      data: mapSaleToResponseDto(saleWithRelations!),
    };
  }

  /**
   * Cancels an existing sale (soft delete).
   *
   * @param id - The sale ID
   * @param userId - The user ID performing the cancellation (from cookie)
   * @returns Result with message
   */
  async cancel(id: number, userId: number) {
    const { data } = await this.findOne(id);

    // Use merge to update the entity
    this.saleRepository.merge(
      data as Sale,
      {
        isCancelled: true,
        cancelledAt: new Date(),
        cancelledBy: { id: userId } as User,
      } as Sale,
    );

    const updatedSale = await this.saleRepository.save(data as Sale);

    return {
      statusCode: HttpStatus.OK,
      message: `Sale with ID: ${id} cancelled successfully`,
      data: mapSaleToResponseDto(updatedSale),
    };
  }
}
