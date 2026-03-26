import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';

/* Entities */
import { Tag } from '@tag/entities/tag.entity';

/* DTO's */
import { CreateTagDto } from '@tag/dto/create-tag.dto';
import { UpdateTagDto } from '@tag/dto/update-tag.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class TagService
  implements IBaseService<Tag, CreateTagDto, UpdateTagDto>
{
  constructor(
    @InjectRepository(Tag)
    private readonly repo: Repository<Tag>,
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
   * Retrieves a list of all active (non-deleted) tags, sorted by name.
   *
   * Supports optional pagination and search via PaginationDto.
   * When no pagination options are provided, all tags are returned.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns {Promise<PaginatedResult<Tag>>} A standardized paginated response.
   */
  async findAll(paginationDto?: PaginationDto): Promise<PaginatedResult<Tag>> {
    const { page, limit, skip } = PaginationHelper.normalizePagination(
      paginationDto?.page,
      paginationDto?.limit,
    );

    // Build where clause with filters
    const where: FindOptionsWhere<Tag> = {
      isDeleted: false,
    };

    // Build search conditions
    const searchConditions: FindOptionsWhere<Tag>[] = [];
    if (paginationDto?.search) {
      const searchTerm = `%${paginationDto.search}%`;
      searchConditions.push({ ...where, name: ILike(searchTerm) });
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

  async findOne(id: Tag['id']): Promise<Result<Tag>> {
    const data = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!data) {
      throw new NotFoundException(`The Tag with ID: ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  async findOneByName(name: string): Promise<Result<Tag>> {
    const data = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { name, isDeleted: false },
    });
    if (!data) {
      throw new NotFoundException(`The Tag with NAME: ${name} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: data,
    };
  }

  async create(dto: CreateTagDto, userId: number) {
    const newTag = this.repo.create({
      ...dto,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const data = await this.repo.save(newTag);
    return {
      statusCode: HttpStatus.CREATED,
      data,
      message: 'The Tag was created',
    };
  }

  async update(id: number, userId: number, changes: UpdateTagDto) {
    const { data } = await this.findOne(id);
    this.repo.merge(data as Tag, { ...changes, updatedBy: { id: userId } });
    const rta = await this.repo.save(data as Tag);
    return {
      statusCode: HttpStatus.OK,
      data: rta,
      message: `The Tag with ID: ${id} has been modified`,
    };
  }

  async remove(id: Tag['id'], userId: number) {
    const { data } = await this.findOne(id);

    const changes = { isDeleted: true, deletedBy: { id: userId } };
    this.repo.merge(data as Tag, changes);
    await this.repo.save(data as Tag);
    return {
      statusCode: HttpStatus.OK,
      message: `The Tag with ID: ${id} has been deleted`,
    };
  }
}
