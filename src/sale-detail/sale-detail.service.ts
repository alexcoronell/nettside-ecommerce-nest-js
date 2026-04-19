/* eslint-disable @typescript-eslint/await-thenable */
import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Entities */
import { SaleDetail } from './entities/sale-detail.entity';

/* DTO's */
import { CreateSaleDetailDto } from './dto/create-sale-detail.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class SaleDetailService {
  constructor(
    @InjectRepository(SaleDetail)
    private readonly repo: Repository<SaleDetail>,
  ) {}

  async count() {
    const total = await this.repo.count();
    return { statusCode: HttpStatus.OK, total };
  }

  async findAll(): Promise<Result<SaleDetail[]>> {
    const [saleDetails, total] = await this.repo.findAndCount();
    return {
      statusCode: HttpStatus.OK,
      data: saleDetails,
      total,
    };
  }

  async findOne(id: number): Promise<Result<SaleDetail>> {
    const saleDetail = await this.repo.findOne({
      where: { id },
    });
    if (!saleDetail) {
      throw new NotFoundException(`The Sale Detail with ID ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: saleDetail,
    };
  }

  async findBySaleId(saleId: number): Promise<Result<SaleDetail[]>> {
    const [saleDetails, total] = await this.repo.findAndCount({
      where: { sale: { id: saleId } },
    });
    return {
      statusCode: HttpStatus.OK,
      data: saleDetails,
      total,
    };
  }

  async create(dtos: CreateSaleDetailDto[]): Promise<Result<SaleDetail[]>> {
    const createSaleDetails = dtos.map((item) => ({
      ...item,
      sale: { id: item.sale },
      product: { id: item.product },
    }));
    const saleDetails = await this.repo.create(createSaleDetails);
    await this.repo.save(saleDetails);
    return {
      statusCode: HttpStatus.CREATED,
      data: saleDetails,
    };
  }
}
