import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

import { IBaseService } from '@commons/interfaces/i-base-service';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';
import { Result } from '@commons/types/result.type';
import { Brand } from '@brand/entities/brand.entity';
import { Category } from '@category/entities/category.entity';
import { ProductImagesService } from '@product_images/product-images.service';
import { Subcategory } from '@subcategory/entities/subcategory.entity';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ResponseProductDto } from './dto/response-product.dto';
import {
  mapProductToResponseDto,
  mapProductsToResponseDto,
} from './mappers/product.mapper';

/**
 * ProductService handles all product-related business logic and persistence.
 *
 * It exposes operations for CRUD, pagination, search, soft deletion, and
 * restore semantics while coordinating related product-image persistence.
 */
@Injectable()
export class ProductService
  implements
    IBaseService<ResponseProductDto, CreateProductDto, UpdateProductDto>
{
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
    private readonly productImagesService: ProductImagesService,
  ) {}

  /**
   * Count all active products that are not marked as deleted.
   *
   * @returns HTTP status and total active product count.
   */
  async count(): Promise<{ statusCode: HttpStatus; total: number }> {
    const total = await this.repo.count({
      where: {
        isDeleted: false,
      },
    });

    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Retrieve active products with optional search, sorting, and pagination.
   *
   * @param paginationDto Optional pagination, search, and ordering options.
   * @returns A paginated result containing response DTOs.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<ResponseProductDto>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    const where: FindOptionsWhere<Product> = {
      isDeleted: false,
    };

    const searchConditions: FindOptionsWhere<Product>[] = [];
    if (paginationDto?.search) {
      const searchTerm = `%${paginationDto.search}%`;
      searchConditions.push(
        { ...where, name: ILike(searchTerm) },
        { ...where, description: ILike(searchTerm) },
      );
    }

    const sortBy = paginationDto?.sortBy || 'name';
    const sortOrder = paginationDto?.sortOrder || 'ASC';

    const [products, total] = await this.repo.findAndCount({
      where: searchConditions.length > 0 ? searchConditions : where,
      relations: ['createdBy', 'updatedBy', 'brand', 'category', 'subcategory'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    const data = mapProductsToResponseDto(products);
    return PaginationHelper.createPaginatedResult(data, total, page, limit);
  }

  /**
   * Retrieve a product by its numeric identifier.
   *
   * @param id Product identifier.
   * @throws NotFoundException when no matching active product is found.
   * @returns Result wrapper containing the product DTO.
   */
  async findOne(id: Product['id']): Promise<Result<ResponseProductDto>> {
    const product = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy', 'brand', 'category', 'subcategory'],
      where: { id, isDeleted: false },
    });

    if (!product) {
      throw new NotFoundException(`The Product with ID: ${id} not found`);
    }

    return {
      statusCode: HttpStatus.OK,
      data: mapProductToResponseDto(product),
    };
  }

  /**
   * Retrieve a product by its slug value.
   *
   * @param slug Product slug.
   * @throws NotFoundException when no matching active product is found.
   * @returns Result wrapper containing the product DTO.
   */
  async findOneBySlug(slug: string): Promise<Result<ResponseProductDto>> {
    const product = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy', 'brand', 'category', 'subcategory'],
      where: { slug, isDeleted: false },
    });

    if (!product) {
      throw new NotFoundException(`The Product with SLUG: ${slug} not found`);
    }

    return {
      statusCode: HttpStatus.OK,
      data: mapProductToResponseDto(product),
    };
  }

  /**
   * Create a new product and optionally persist related images.
   *
   * @param dto Product creation payload.
   * @param userId Identifier of the authenticated user.
   * @param images Optional uploaded images to associate with the product.
   * @returns Result wrapper containing created product data and message.
   */
  async create(
    dto: CreateProductDto,
    userId: number,
    images: Express.Multer.File[] = [],
  ) {
    const brandId = dto.brand;
    const categoryId = dto.category;
    const subcategoryId = dto.subcategory;
    const createProduct = {
      ...dto,
      brand: { id: brandId } as Brand,
      category: { id: categoryId },
      subcategory: { id: subcategoryId },
      createdBy: { id: userId },
      updatedBy: { id: userId },
    };

    const newProduct = this.repo.create(createProduct);
    const product = await this.repo.save(newProduct);

    if (images && images.length > 0) {
      await this.productImagesService.create(images, userId, product.id);
    }

    return {
      statusCode: HttpStatus.CREATED,
      data: mapProductToResponseDto(product),
      message: 'The Product was created',
    };
  }

  /**
   * Apply partial updates to an existing product.
   *
   * @param id Product identifier.
   * @param userId Identifier of the authenticated user.
   * @param changes Partial product fields to update.
   * @param images Optional uploaded images to associate with the product.
   * @returns Result wrapper containing updated product data and message.
   */
  async update(
    id: number,
    userId: number,
    changes: UpdateProductDto,
    images: Express.Multer.File[] = [],
  ) {
    const productEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!productEntity) {
      throw new NotFoundException(`The Product with ID: ${id} not found`);
    }

    const brandId = changes.brand;
    const categoryId = changes.category;
    const subcategoryId = changes.subcategory;
    const updateProduct = {
      ...changes,
      brand: { id: brandId } as Brand,
      category: { id: categoryId } as Category,
      subcategory: { id: subcategoryId } as Subcategory,
      updatedBy: { id: userId },
    };

    this.repo.merge(productEntity, updateProduct);
    const rta = await this.repo.save(productEntity);

    const updatedProduct = await this.repo.findOne({
      relations: ['brand', 'category', 'subcategory'],
      where: { id: rta.id },
    });

    if (images && images.length > 0) {
      await this.productImagesService.create(images, userId, id);
    }

    return {
      statusCode: HttpStatus.OK,
      data: mapProductToResponseDto(updatedProduct!),
      message: `The Product with ID: ${id} has been modified`,
    };
  }

  /**
   * Soft delete a product by marking it as deleted.
   *
   * @param id Product identifier.
   * @param userId Identifier of the authenticated user.
   * @returns HTTP result containing deletion confirmation.
   */
  async remove(id: Product['id'], userId: number) {
    const productEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!productEntity) {
      throw new NotFoundException(`The Product with ID: ${id} not found`);
    }

    const changes = {
      isDeleted: true,
      deletedBy: { id: userId },
      deletedAt: new Date(),
    };

    this.repo.merge(productEntity, changes);
    await this.repo.save(productEntity);

    return {
      statusCode: HttpStatus.OK,
      message: `The Product with ID: ${id} has been deleted`,
    };
  }

  /**
   * Restore a previously soft deleted product.
   *
   * @param id Product identifier.
   * @param userId Identifier of the authenticated user.
   * @returns HTTP result containing restore confirmation.
   */
  async restore(id: Product['id'], userId: number) {
    const productEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!productEntity) {
      throw new NotFoundException(`The Product with ID: ${id} not found`);
    }

    const changes = {
      isDeleted: false,
      deletedBy: { id: userId },
      deletedAt: new Date(),
    };

    this.repo.merge(productEntity, changes);
    await this.repo.save(productEntity);

    return {
      statusCode: HttpStatus.OK,
      message: `The Product with ID: ${id} has been restored`,
    };
  }
}
