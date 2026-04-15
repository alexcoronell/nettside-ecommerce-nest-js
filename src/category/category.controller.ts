/**
 * @fileoverview CategoryController - Controller for category management
 *
 * Handles HTTP requests for category CRUD operations.
 * All endpoints return ResponseCategoryDto for consistent API responses.
 *
 * @module CategoryController
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
import { CategoryService } from '@category/category.service';

/* DTO's */
import { CreateCategoryDto } from '@category/dto/create-category.dto';
import { UpdateCategoryDto } from '@category/dto/update-category.dto';
import { ResponseCategoryDto } from '@category/dto/response-category.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';

/**
 * Controller for managing category-related operations.
 *
 * @description
 * Provides endpoints for:
 * - Counting active categories
 * - Listing categories with pagination and search
 * - Finding categories by ID or slug
 * - Creating, updating, and deleting categories
 *
 * @example
 * // Base endpoint: /category
 * // All protected endpoints require JWT authentication
 * // Admin-only endpoints additionally require admin role
 */
@ApiTags('Categories')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Gets the count of active (non-deleted) categories.
   *
   * @returns Object containing the total count of active categories
   * @throws UnauthorizedException if user is not authenticated
   * @throws ForbiddenException if user is a customer
   *
   * @endpoint GET /category/count
   * @security JWT + Non-customer role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Count active categories',
    description:
      'Returns the total number of active (non-deleted) categories in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'Total count of active categories',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        total: { type: 'number', example: 15 },
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
    return this.categoryService.count();
  }

  /**
   * Retrieves all active categories with optional pagination and search.
   *
   * @param paginationDto - Optional pagination parameters (page, limit, search, sortBy, sortOrder)
   * @returns Paginated list of active categories
   *
   * @endpoint GET /category
   * @public
   */
  @ApiOperation({
    summary: 'Get all categories',
    description:
      'Returns a paginated list of active categories. Supports pagination, search by name/slug, and sorting.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of categories',
    type: ResponseCategoryDto,
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
    description: 'Search term to filter categories by name or slug',
    type: String,
    example: 'electronics',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by (name, createdAt, etc.)',
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
    return this.categoryService.findAll(paginationDto);
  }

  /**
   * Finds a category by its unique identifier.
   *
   * @param id - Numeric identifier of the category
   * @returns Category object corresponding to the provided ID
   * @throws NotFoundException if category with given ID does not exist
   *
   * @endpoint GET /category/:id
   * @security JWT + Non-customer role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Retrieves a single category by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Category found',
    type: ResponseCategoryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is a customer',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  /**
   * Finds a category by its slug.
   *
   * @param slug - Slug identifier of the category
   * @returns Category object corresponding to the provided slug
   * @throws NotFoundException if category with given slug does not exist
   *
   * @endpoint GET /category/slug/:slug
   * @security JWT + Non-customer role (Admin or Seller)
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get category by slug',
    description:
      'Retrieves a single category by its URL-friendly slug. Admin or Seller only.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Category slug (URL-friendly identifier)',
    type: String,
    example: 'electronics',
  })
  @ApiResponse({
    status: 200,
    description: 'Category found',
    type: ResponseCategoryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is a customer',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get('slug/:slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.categoryService.findOneBySlug(slug);
  }

  /**
   * Creates a new category.
   *
   * @param payload - Data required to create a new category
   * @param userId - ID of the authenticated user creating the category
   * @returns Created Category object
   * @throws ConflictException if category name already exists
   * @throws BadRequestException if validation fails
   *
   * @endpoint POST /category
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Create a new category',
    description:
      'Creates a new category. The slug is auto-generated from the name.',
  })
  @ApiResponse({
    status: 201,
    description: 'Category successfully created',
    type: ResponseCategoryDto,
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
    description: 'Conflict - Category name already exists',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() payload: CreateCategoryDto, @UserId() userId: number) {
    return this.categoryService.create(payload, userId);
  }

  /**
   * Updates an existing category.
   *
   * @param id - Identifier of the category to update
   * @param payload - Data to update the category
   * @param userId - ID of the authenticated user updating the category
   * @returns Updated Category object
   * @throws NotFoundException if category does not exist
   *
   * @endpoint PATCH /category/:id
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Update a category',
    description:
      'Updates an existing category. Supports partial updates. Note: slug cannot be changed after creation.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID to update',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Category successfully updated',
    type: ResponseCategoryDto,
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
    description: 'Category not found',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateCategoryDto,
    @UserId() userId: number,
  ) {
    return this.categoryService.update(id, userId, payload);
  }

  /**
   * Soft deletes a category by marking it as deleted.
   *
   * @param id - Identifier of the category to delete
   * @param userId - ID of the authenticated user performing the deletion
   * @returns Success message
   * @throws NotFoundException if category does not exist
   *
   * @endpoint DELETE /category/:id
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Delete a category',
    description:
      'Soft deletes a category by marking it as deleted. The category is not permanently removed.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID to delete',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Category successfully deleted',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'The Category with ID: 1 has been deleted',
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
    description: 'Category not found',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.categoryService.remove(id, userId);
  }
}
