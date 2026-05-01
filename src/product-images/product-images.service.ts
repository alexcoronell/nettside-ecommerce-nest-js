import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

/* Services */
import { UploadService } from '@upload/upload.service';

/* Entities */
import { ProductImage } from './entities/product-image.entity';
import { Product } from '@product/entities/product.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { CreateProductImageDto } from '@product_images/dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class ProductImagesService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly repo: Repository<ProductImage>,
    private readonly uploadService: UploadService,
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
   * Retrieves a list of all active (non-deleted) product images, sorted by title.
   *
   * Supports optional pagination and search via PaginationDto.
   * When no pagination options are provided, all product images are returned.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns {Promise<PaginatedResult<ProductImage>>} A standardized paginated response.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<ProductImage>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<ProductImage> = {
      isDeleted: false,
    };

    // Build search conditions
    const searchConditions: FindOptionsWhere<ProductImage>[] = [];
    if (paginationDto?.search) {
      const searchTerm = `%${paginationDto.search}%`;
      searchConditions.push(
        { ...where, title: ILike(searchTerm) },
        { ...where, filePath: ILike(searchTerm) },
      );
    }

    // Determine sort field and order
    const sortBy = paginationDto?.sortBy || 'title';
    const sortOrder = paginationDto?.sortOrder || 'ASC';

    // Execute query
    const [data, total] = await this.repo.findAndCount({
      where: searchConditions.length > 0 ? searchConditions : where,
      relations: ['product', 'createdBy', 'updatedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Return paginated result
    return PaginationHelper.createPaginatedResult(data, total, page, limit);
  }

  async findOne(id: ProductImage['id']): Promise<Result<ProductImage>> {
    const productImage = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!productImage) {
      throw new NotFoundException(`The Product Image with id: ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: productImage,
    };
  }

  async create(
    images: Express.Multer.File[],
    userId: number,
    productId: number,
  ) {
    if (!images || images.length === 0) {
      throw new NotFoundException(`No images provided for upload`);
    }
    let countImages = 0;
    for (const image of images) {
      const uploadResult = await this.uploadService.uploadProductImage(image);
      const newProductImage: CreateProductImageDto = {
        filePath: uploadResult.url,
        title: image.originalname,
        isMain: countImages === 0,
        isActive: true,
        product: { id: productId } as Product,
        createdBy: { id: userId } as User,
      };
      this.repo.create();
      await this.repo.save(newProductImage);
      countImages++;
    }

    return {
      statusCode: HttpStatus.CREATED,
      data: null,
      message: 'Total images uploaded: ' + countImages,
    };
  }

  async update(
    id: ProductImage['id'],
    userId: number,
    changes: UpdateProductImageDto,
  ) {
    const { data } = await this.findOne(id);
    this.repo.merge(data as ProductImage, {
      ...changes,
      updatedBy: { id: userId },
    });
    const rta = await this.repo.save(data as ProductImage);
    return {
      statusCode: HttpStatus.OK,
      data: rta,
      message: `The Product Image with ID: ${id} has been modified`,
    };
  }

  async remove(id: ProductImage['id']) {
    const { data } = await this.findOne(id);

    const changes = { isDeleted: true };
    this.repo.merge(data as ProductImage, changes);
    await this.repo.save(data as ProductImage);
    return {
      statusCode: HttpStatus.OK,
      message: `The Product Image with id: ${id} has been deleted`,
    };
  }
}
