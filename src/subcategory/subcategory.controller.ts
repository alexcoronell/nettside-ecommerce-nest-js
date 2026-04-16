/**
 * @fileoverview SubcategoryController - Controller for subcategory management
 *
 * Handles HTTP requests for subcategory CRUD operations.
 * All endpoints return ResponseSubcategoryDto for consistent API responses.
 *
 * @module SubcategoryController
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

/* NestJS Core */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

/* Swagger */
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

/* Decorators */
import { UserId } from '@auth/decorators/user-id.decorator';

/* Services */
import { SubcategoryService } from './subcategory.service';

/* DTO's */
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { ResponseSubcategoryDto } from './dto/response-subcategory.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';

/**
 * Controller for managing subcategory-related operations.
 *
 * @description
 * Provides endpoints for:
 * - Counting active subcategories
 * - Listing subcategories with pagination and search
 * - Finding subcategories by ID or slug
 * - Finding subcategories by category ID
 * - Creating, updating, and deleting subcategories
 *
 * @example
 * // Base endpoint: /subcategory
 * // All protected endpoints require JWT authentication
 * // Admin-only endpoints additionally require admin role
 * // Some endpoints require non-customer role (admin or seller)
 */
@ApiTags('Subcategories')
@Controller('subcategory')
export class SubcategoryController {
  constructor(private readonly subcategoryService: SubcategoryService) {}

  /**
   * Gets the count of active (non-deleted) subcategories.
   *
   * @returns Object containing the total count of active subcategories
   * @throws UnauthorizedException if user is not authenticated
   * @throws ForbiddenException if user is a customer
   *
   * @endpoint GET /subcategory/count
   * @security JWT + Non-customer role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Count active subcategories',
    description:
      'Returns the total number of active (non-deleted) subcategories in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'Total count of active subcategories',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        total: { type: 'number', example: 25 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is a customer',
  })
  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get('count')
  count() {
    return this.subcategoryService.count();
  }

  /**
   * Retrieves all active subcategories with optional pagination and search.
   *
   * @param paginationDto - Optional pagination parameters (page, limit, search, sortBy, sortOrder)
   * @returns Paginated list of active subcategories
   *
   * @endpoint GET /subcategory
   * @security Public (no authentication required)
   */
  @ApiOperation({
    summary: 'Get all subcategories',
    description:
      'Returns a paginated list of active subcategories. Supports pagination, search by name or slug, and sorting.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of subcategories',
    type: ResponseSubcategoryDto,
    isArray: false,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starting from 1)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (max 100)',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term to filter subcategories by name or slug',
    type: String,
    example: 'smart',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by (name, slug, createdAt, etc.)',
    type: String,
    example: 'name',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (ASC or DESC)',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.subcategoryService.findAll(paginationDto);
  }

  /**
   * Retrieves all active subcategories for a specific category.
   *
   * @param category - Numeric identifier of the category
   * @returns Array of subcategories belonging to the specified category
   *
   * @endpoint GET /subcategory/category/:category
   * @security Public (no authentication required)
   */
  @ApiOperation({
    summary: 'Get subcategories by category',
    description:
      'Returns all active subcategories that belong to a specific category.',
  })
  @ApiParam({
    name: 'category',
    description: 'Category ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'List of subcategories for the category',
    type: ResponseSubcategoryDto,
    isArray: true,
  })
  @Get('category/:category')
  findAllByCategory(@Param('category', ParseIntPipe) category: number) {
    return this.subcategoryService.findAllByCategory(category);
  }

  /**
   * Finds a subcategory by its unique identifier.
   *
   * @param id - Numeric identifier of the subcategory
   * @returns Subcategory object corresponding to the provided ID
   * @throws NotFoundException if subcategory with given ID does not exist
   *
   * @endpoint GET /subcategory/:id
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get subcategory by ID',
    description: 'Retrieves a single subcategory by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subcategory ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Subcategory found',
    type: ResponseSubcategoryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not an admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Subcategory not found',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subcategoryService.findOne(id);
  }

  /**
   * Finds a subcategory by its slug.
   *
   * @param slug - URL-friendly slug of the subcategory
   * @returns Subcategory object corresponding to the provided slug
   * @throws NotFoundException if subcategory with given slug does not exist
   *
   * @endpoint GET /subcategory/slug/:slug
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get subcategory by slug',
    description: 'Retrieves a single subcategory by its URL-friendly slug.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Subcategory slug (URL-friendly)',
    type: String,
    example: 'smartphones',
  })
  @ApiResponse({
    status: 200,
    description: 'Subcategory found',
    type: ResponseSubcategoryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not an admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Subcategory not found',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('slug/:slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.subcategoryService.findOneBySlug(slug);
  }

  /**
   * Creates a new subcategory.
   *
   * @param payload - Data required to create a new subcategory
   * @param userId - ID of the authenticated user creating the subcategory
   * @returns Created Subcategory object
   * @throws ConflictException if subcategory name already exists in the same category
   * @throws BadRequestException if validation fails
   *
   * @endpoint POST /subcategory
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Create a new subcategory',
    description:
      'Creates a new subcategory. The subcategory name must be unique within its category. Slug is auto-generated from the name.',
  })
  @ApiResponse({
    status: 201,
    description: 'Subcategory successfully created',
    type: ResponseSubcategoryDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not an admin',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Subcategory name already exists in category',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() payload: CreateSubcategoryDto, @UserId() userId: number) {
    return this.subcategoryService.create(payload, userId);
  }

  /**
   * Updates an existing subcategory.
   *
   * @param id - Identifier of the subcategory to update
   * @param payload - Data to update the subcategory
   * @param userId - ID of the authenticated user updating the subcategory
   * @returns Updated Subcategory object
   * @throws NotFoundException if subcategory does not exist
   * @throws ConflictException if subcategory name already exists in the same category
   *
   * @endpoint PATCH /subcategory/:id
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Update a subcategory',
    description:
      'Updates an existing subcategory. Supports partial updates. Slug is auto-generated if name changes.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subcategory ID to update',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Subcategory successfully updated',
    type: ResponseSubcategoryDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not an admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Subcategory not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Subcategory name already exists in category',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateSubcategoryDto,
    @UserId() userId: number,
  ) {
    return this.subcategoryService.update(id, userId, payload);
  }

  /**
   * Soft deletes a subcategory by marking it as deleted.
   *
   * @param id - Identifier of the subcategory to delete
   * @param userId - ID of the authenticated user performing the deletion
   * @returns Success message
   * @throws NotFoundException if subcategory does not exist
   *
   * @endpoint DELETE /subcategory/:id
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Delete a subcategory',
    description:
      'Soft deletes a subcategory by marking it as deleted. The subcategory is not permanently removed.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subcategory ID to delete',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Subcategory successfully deleted',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'The Subcategory with ID: 1 has been deleted',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not an admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Subcategory not found',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.subcategoryService.remove(id, userId);
  }
}
