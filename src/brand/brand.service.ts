import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';

/* Entities */
import { Brand } from '@brand/entities/brand.entity';

/* DTO's */
import { CreateBrandDto } from '@brand/dto/create-brand.dto';
import { UpdateBrandDto } from '@brand/dto/update-brand.dto';
import { ResponseBrandDto } from '@brand/dto/response-brand.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

/* Utils */
import { createSlug } from '@commons/utils/create-slug.util';

/* Services */
import { UploadService } from '@upload/upload.service';

/* Mappers */
import {
  mapBrandToResponseDto,
  mapBrandsToResponseDto,
} from './mappers/brand.mapper';

@Injectable()
export class BrandService
  implements IBaseService<ResponseBrandDto, CreateBrandDto, UpdateBrandDto>
{
  constructor(
    @InjectRepository(Brand)
    private readonly repo: Repository<Brand>,
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
   * Retrieves a list of all active (non-deleted) brands, sorted by name.
   *
   * Supports optional pagination and search via PaginationDto.
   * When no pagination options are provided, all brands are returned.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns {Promise<PaginatedResult<ResponseBrandDto>>} A standardized paginated response.
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<ResponseBrandDto>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<Brand> = {
      isDeleted: false,
    };

    // Build search conditions
    const searchConditions: FindOptionsWhere<Brand>[] = [];
    if (paginationDto?.search) {
      const searchTerm = `%${paginationDto.search}%`;
      searchConditions.push(
        { ...where, name: ILike(searchTerm) },
        { ...where, slug: ILike(searchTerm) },
      );
    }

    // Determine sort field and order
    const sortBy = paginationDto?.sortBy || 'name';
    const sortOrder = paginationDto?.sortOrder || 'ASC';

    // Execute query
    const [brands, total] = await this.repo.findAndCount({
      where: searchConditions.length > 0 ? searchConditions : where,
      relations: ['createdBy', 'updatedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Map to DTO and return paginated result
    const data = mapBrandsToResponseDto(brands);
    return PaginationHelper.createPaginatedResult(data, total, page, limit);
  }

  async findOne(id: Brand['id']): Promise<Result<ResponseBrandDto>> {
    const brand = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!brand) {
      throw new NotFoundException(`The Brand with ID: ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: mapBrandToResponseDto(brand),
    };
  }

  async findOneBySlug(slug: Brand['slug']): Promise<Result<ResponseBrandDto>> {
    const brand = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { slug, isDeleted: false },
    });
    if (!brand) {
      throw new NotFoundException(`The Brand with SLUG: ${slug} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: mapBrandToResponseDto(brand),
    };
  }

  async create(dto: CreateBrandDto, userId: number) {
    const newBrand = this.repo.create({
      ...dto,
      slug: createSlug(dto.name),
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const brand = await this.repo.save(newBrand);
    // Fetch with relations for mapping
    const savedBrand = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id: brand.id },
    });
    return {
      statusCode: HttpStatus.CREATED,
      data: mapBrandToResponseDto(savedBrand!),
      message: 'The Brand was created',
    };
  }

  async update(
    id: number,
    userId: number,
    changes: UpdateBrandDto,
    file?: Express.Multer.File,
  ) {
    const brandEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });
    if (!brandEntity) {
      throw new NotFoundException(`The Brand with ID: ${id} not found`);
    }

    let logoValue: string | null | undefined = changes.logo;

    if (!file && brandEntity.logo) {
      const extracted = this.uploadService.extractKeyFromUrl(brandEntity.logo);
      if (extracted) {
        await this.uploadService.deleteFile(extracted.key, extracted.bucket);
      }
      logoValue = null;
    } else if (file) {
      if (brandEntity.logo) {
        const extracted = this.uploadService.extractKeyFromUrl(
          brandEntity.logo,
        );
        if (extracted) {
          await this.uploadService.deleteFile(extracted.key, extracted.bucket);
        }
      }
      const uploadResult = await this.uploadService.uploadLogo(file);
      logoValue = uploadResult.url;
    }

    const updateData = {
      ...changes,
      ...(logoValue !== undefined && { logo: logoValue }),
      updatedBy: { id: userId },
    };

    this.repo.merge(brandEntity, updateData);
    const rta = await this.repo.save(brandEntity);
    // Fetch with relations for mapping
    const updatedBrand = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id: rta.id },
    });
    return {
      statusCode: HttpStatus.OK,
      data: mapBrandToResponseDto(updatedBrand!),
      message: `The Brand with ID: ${id} has been modified`,
    };
  }

  async remove(id: Brand['id'], userId: number) {
    const brandEntity = await this.repo.findOne({
      where: { id, isDeleted: false },
    });
    if (!brandEntity) {
      throw new NotFoundException(`The Brand with ID: ${id} not found`);
    }

    const changes = { isDeleted: true, deletedBy: { id: userId } };
    this.repo.merge(brandEntity, changes);
    await this.repo.save(brandEntity);
    return {
      statusCode: HttpStatus.OK,
      message: `The Brand with ID: ${id} has been deleted`,
    };
  }
}
