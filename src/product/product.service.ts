import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';

/* Entities */
import { Brand } from '@brand/entities/brand.entity';
import { Category } from '@category/entities/category.entity';
import { Product } from './entities/product.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';

/* DTO's */
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';
import { ResponseProductDto } from './dto/response-product.dto';

/* Mappers */
import {
  mapProductToResponseDto,
  mapProductsToResponseDto,
} from './mappers/product.mapper';

@Injectable()
export class ProductService
  implements
    IBaseService<ResponseProductDto, CreateProductDto, UpdateProductDto>
{
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async count() {
    const total = await this.repo.count({
      where: {
        isDeleted: false,
      },
    });
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Retrieves a list of all active (non-deleted) products, sorted by name.
   *
   * Supports optional pagination and search via PaginationDto.
   * When no pagination options are provided, all products are returned.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns {Promise<PaginatedResult<Product>>} A standardized paginated response.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<ResponseProductDto>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<Product> = {
      isDeleted: false,
    };

    // Build search conditions
    const searchConditions: FindOptionsWhere<Product>[] = [];
    if (paginationDto?.search) {
      const searchTerm = `%${paginationDto.search}%`;
      searchConditions.push(
        { ...where, name: ILike(searchTerm) },
        { ...where, description: ILike(searchTerm) },
      );
    }

    // Determine sort field and order
    const sortBy = paginationDto?.sortBy || 'name';
    const sortOrder = paginationDto?.sortOrder || 'ASC';

    // Execute query
    const [products, total] = await this.repo.findAndCount({
      where: searchConditions.length > 0 ? searchConditions : where,
      relations: ['createdBy', 'updatedBy', 'brand', 'category', 'subcategory'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Map to DTO and return paginated result
    const data = mapProductsToResponseDto(products);
    return PaginationHelper.createPaginatedResult(data, total, page, limit);
  }

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

  async create(dto: CreateProductDto, userId: number) {
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
    // Fetch with relations for mapping
    const savedProduct = await this.repo.findOne({
      relations: ['brand', 'category', 'subcategory'],
      where: { id: product.id },
    });
    return {
      statusCode: HttpStatus.CREATED,
      data: mapProductToResponseDto(savedProduct!),
      message: 'The Product was created',
    };
  }

  async update(id: number, userId: number, changes: UpdateProductDto) {
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
    // Fetch with relations for mapping
    const updatedProduct = await this.repo.findOne({
      relations: ['brand', 'category', 'subcategory'],
      where: { id: rta.id },
    });
    return {
      statusCode: HttpStatus.OK,
      data: mapProductToResponseDto(updatedProduct!),
      message: `The Product with ID: ${id} has been modified`,
    };
  }

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
}
