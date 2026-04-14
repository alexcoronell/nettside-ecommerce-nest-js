import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Entities */
import { ProductDiscount } from './entities/product-discount.entity';
import { Product } from '@product/entities/product.entity';
import { Discount } from '@discount/entities/discount.entity';

/* DTO's */
import { CreateProductDiscountDto } from './dto/create-product-discount.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class ProductDiscountService {
  constructor(
    @InjectRepository(ProductDiscount)
    private readonly repo: Repository<ProductDiscount>,
  ) {}

  async count() {
    const total = await this.repo.count();
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Retrieves a list of all product discounts with optional pagination.
   *
   * Supports optional pagination via PaginationDto.
   * When no pagination options are provided, all product discounts are returned.
   *
   * @param paginationDto - Optional pagination parameters.
   * @returns {Promise<PaginatedResult<ProductDiscount>>} A standardized paginated response.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<ProductDiscount>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Determine sort field and order
    const sortBy = paginationDto?.sortBy || 'createdAt';
    const sortOrder = paginationDto?.sortOrder || 'DESC';

    // Execute query
    const [data, total] = await this.repo.findAndCount({
      relations: ['product', 'discount', 'createdBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Return paginated result
    return PaginationHelper.createPaginatedResult(data, total, page, limit);
  }

  async findOne(
    productId: Product['id'],
    discountId: Discount['id'],
  ): Promise<Result<ProductDiscount>> {
    const productDiscount = await this.repo.findOne({
      where: { productId, discountId },
    });
    if (!productDiscount) {
      throw new NotFoundException(
        `The Product Discount with Product ID: ${productId} and Discount ID: ${discountId} Not Found`,
      );
    }
    return {
      statusCode: HttpStatus.OK,
      data: productDiscount,
    };
  }

  async findAllByProduct(
    id: Product['id'],
  ): Promise<Result<ProductDiscount[]>> {
    const [productDiscounts, total] = await this.repo.findAndCount({
      relations: ['product', 'discount'],
      where: { product: { id } },
    });
    return {
      statusCode: HttpStatus.OK,
      data: productDiscounts,
      total,
    };
  }

  async findAllByDiscount(
    id: Discount['id'],
  ): Promise<Result<ProductDiscount[]>> {
    const [productDiscounts, total] = await this.repo.findAndCount({
      relations: ['product', 'discount'],
      where: { discount: { id } },
    });
    return {
      statusCode: HttpStatus.OK,
      data: productDiscounts,
      total,
    };
  }

  async create(
    dto: CreateProductDiscountDto,
    userId: number,
  ): Promise<Result<ProductDiscount>> {
    const productDiscount = this.repo.create({
      product: { id: dto.product } as Product,
      discount: { id: dto.discount } as Discount,
      createdBy: { id: userId },
    });
    await this.repo.save(productDiscount);
    return {
      statusCode: HttpStatus.CREATED,
      data: productDiscount,
      message: 'Product Discount created successfully',
    };
  }

  async createMany(
    dtos: CreateProductDiscountDto[],
    userId: number,
  ): Promise<Result<ProductDiscount[]>> {
    const dtosArray = Array.isArray(dtos) ? dtos : [dtos];
    const createProductDiscounts = dtosArray.map((item) => ({
      product: { id: item.product } as Product,
      discount: { id: item.discount } as Discount,
      createdBy: { id: userId },
    }));
    const newProductDiscounts = this.repo.create(createProductDiscounts);
    const productDiscounts = await this.repo.save(newProductDiscounts);
    return {
      statusCode: HttpStatus.CREATED,
      data: productDiscounts,
      message: 'The Product Discounts were created',
    };
  }

  async delete(
    productId: Product['id'],
    discountId: Discount['id'],
  ): Promise<Result<void>> {
    await this.findOne(productId, discountId);

    await this.repo.delete({
      product: { id: productId },
      discount: { id: discountId },
    });

    return {
      statusCode: HttpStatus.OK,
      message: `The Product Discount with Product ID: ${productId} and Discount ID: ${discountId} deleted successfully`,
    };
  }
}
