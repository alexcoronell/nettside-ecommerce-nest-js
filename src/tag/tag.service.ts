/**
 * @fileoverview TagService - Service for tag business logic
 *
 * Handles all business operations for tag management including
 * CRUD operations, pagination, and search.
 *
 * @module TagService
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

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
import { ResponseTagDto } from '@tag/dto/response-tag.dto';
import {
  PaginationDto,
  PaginatedResult,
  PaginationHelper,
} from '@commons/dtos/Pagination.dto';

/* Mappers */
import {
  mapTagToResponseDto,
  mapTagsToResponseDto,
} from './mappers/tag.mapper';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class TagService
  implements IBaseService<ResponseTagDto, CreateTagDto, UpdateTagDto>
{
  constructor(
    @InjectRepository(Tag)
    private readonly repo: Repository<Tag>,
  ) {}

  /**
   * Counts all active (non-deleted) tags in the system.
   *
   * @returns Promise resolving to an object with statusCode and total count
   */
  async count(): Promise<Result<number>> {
    const total = await this.repo.count({
      where: {
        isDeleted: false,
      },
    });
    return { statusCode: HttpStatus.OK, total };
  }

  /**
   * Retrieves a paginated list of active tags with optional search and sorting.
   *
   * @param paginationDto - Optional pagination parameters (page, limit, search, sortBy, sortOrder)
   * @returns Promise resolving to a paginated result containing an array of ResponseTagDto
   */
  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<ResponseTagDto>> {
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
    const [tags, total] = await this.repo.findAndCount({
      where: searchConditions.length > 0 ? searchConditions : where,
      relations: ['createdBy', 'updatedBy', 'deletedBy'],
      order: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Return paginated result using mapper
    return PaginationHelper.createPaginatedResult(
      mapTagsToResponseDto(tags),
      total,
      page,
      limit,
    );
  }

  /**
   * Finds a tag entity by ID for internal use (update, remove, etc).
   * Does NOT use mapper - returns the raw entity.
   *
   * @param id - The ID of the tag to retrieve.
   * @returns Promise resolving to the raw Tag entity.
   * @throws NotFoundException if tag is not found or is deleted
   */
  private async findOneEntity(id: Tag['id']): Promise<Tag> {
    const tag = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy', 'deletedBy'],
      where: { id, isDeleted: false },
    });
    if (!tag) {
      throw new NotFoundException(`The Tag with ID: ${id} not found`);
    }
    return tag;
  }

  /**
   * Retrieves a single tag by its ID.
   *
   * @param id - The unique identifier of the tag
   * @returns Promise resolving to a Result containing the ResponseTagDto
   * @throws NotFoundException if tag is not found or is deleted
   */
  async findOne(id: Tag['id']): Promise<Result<ResponseTagDto>> {
    const tag = await this.findOneEntity(id);
    return {
      statusCode: HttpStatus.OK,
      data: mapTagToResponseDto(tag),
    };
  }

  /**
   * Creates a new tag.
   *
   * @param dto - CreateTagDto containing the tag data
   * @param userId - ID of the user creating the tag
   * @returns Promise resolving to a Result containing the created ResponseTagDto
   */
  async create(
    dto: CreateTagDto,
    userId: number,
  ): Promise<Result<ResponseTagDto>> {
    const newTag = this.repo.create({
      ...dto,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const tag = await this.repo.save(newTag);

    // Fetch with relations for proper mapping
    const savedTag = await this.repo.findOne({
      where: { id: tag.id },
      relations: ['createdBy', 'updatedBy', 'deletedBy'],
    });

    return {
      statusCode: HttpStatus.CREATED,
      data: mapTagToResponseDto(savedTag!),
      message: 'The Tag was created',
    };
  }

  /**
   * Updates an existing tag.
   *
   * @param id - ID of the tag to update
   * @param userId - ID of the user performing the update
   * @param changes - UpdateTagDto containing the fields to update
   * @returns Promise resolving to a Result containing the updated ResponseTagDto
   * @throws NotFoundException if tag is not found
   */
  async update(
    id: number,
    userId: number,
    changes: UpdateTagDto,
  ): Promise<Result<ResponseTagDto>> {
    const tag = await this.findOneEntity(id);
    this.repo.merge(tag, { ...changes, updatedBy: { id: userId } });
    const updatedTag = await this.repo.save(tag);

    // Fetch with relations for proper mapping
    const savedTag = await this.repo.findOne({
      where: { id: updatedTag.id },
      relations: ['createdBy', 'updatedBy', 'deletedBy'],
    });

    return {
      statusCode: HttpStatus.OK,
      data: mapTagToResponseDto(savedTag!),
      message: `The Tag with ID: ${id} has been modified`,
    };
  }

  /**
   * Soft deletes a tag by marking it as deleted.
   *
   * @param id - ID of the tag to delete
   * @param userId - ID of the user performing the deletion
   * @returns Promise resolving to an object with statusCode and message
   * @throws NotFoundException if tag is not found
   */
  async remove(id: Tag['id'], userId: number) {
    const tag = await this.findOneEntity(id);

    const changes = {
      deletedBy: { id: userId },
      isDeleted: true,
    };

    this.repo.merge(tag, changes);
    await this.repo.save(tag);
    return {
      statusCode: HttpStatus.OK,
      message: `The Tag with ID: ${id} has been deleted`,
    };
  }
}
