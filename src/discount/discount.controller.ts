/**
 * @fileoverview DiscountController - Controller for discount management
 *
 * Handles HTTP requests for discount CRUD operations.
 * All endpoints return ResponseDiscountDto for consistent API responses.
 *
 * @module DiscountController
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
import { DiscountService } from '@discount/discount.service';

/* DTO's */
import { CreateDiscountDto } from '@discount/dto/create-discount.dto';
import { UpdateDiscountDto } from '@discount/dto/update-discount.dto';
import { ResponseDiscountDto } from '@discount/dto/response-discount.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';

/**
 * Controller for managing discount-related operations.
 *
 * @description
 * Provides endpoints for:
 * - Counting active discounts
 * - Listing discounts with pagination and search
 * - Finding discounts by ID
 * - Creating, updating, and deleting discounts
 *
 * @example
 * // Base endpoint: /discount
 * // All protected endpoints require JWT authentication
 * // Admin-only endpoints additionally require admin role
 */
@ApiTags('Discounts')
@Controller('discount')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  /**
   * Gets the count of active (non-deleted) discounts.
   *
   * @returns Object containing the total count of active discounts
   * @throws UnauthorizedException if user is not authenticated
   * @throws ForbiddenException if user is a customer
   *
   * @endpoint GET /discount/count
   * @security JWT + Non-customer role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Count active discounts',
    description:
      'Returns the total number of active (non-deleted) discounts in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'Total count of active discounts',
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
    return this.discountService.count();
  }

  /**
   * Retrieves all active discounts with optional pagination and search.
   *
   * @param paginationDto - Optional pagination parameters (page, limit, search, sortBy, sortOrder)
   * @returns Paginated list of active discounts
   *
   * @endpoint GET /discount
   * @security JWT + Non-customer role (Admin or Seller)
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get all discounts',
    description:
      'Returns a paginated list of active discounts. Supports pagination, search by name/description, and sorting.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of discounts',
    type: ResponseDiscountDto,
    isArray: false,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is a customer',
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
    description: 'Search term to filter discounts by name or description',
    type: String,
    example: 'SUMMER',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by (name, value, createdAt, etc.)',
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
  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.discountService.findAll(paginationDto);
  }

  /**
   * Retrieves all active discounts without pagination.
   * Public endpoint - no authentication required.
   *
   * @returns Array of discounts with only id and name fields
   *
   * @endpoint GET /discount/all
   * @security Public (no authentication)
   */
  @ApiOperation({
    summary: 'Get all discounts without pagination',
    description:
      'Returns all active discounts without pagination. Useful for dropdowns or lists. Only returns id and name fields.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of discounts with id and name',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Summer Sale' },
            },
          },
        },
      },
    },
  })
  @Get('all')
  findAllNoPagination() {
    return this.discountService.findAllNoPagination();
  }

  /**
   * Finds a discount by its unique identifier.
   *
   * @param id - Numeric identifier of the discount
   * @returns Discount object corresponding to the provided ID
   * @throws NotFoundException if discount with given ID does not exist
   *
   * @endpoint GET /discount/:id
   * @security JWT + Non-customer role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get discount by ID',
    description: 'Retrieves a single discount by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Discount ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Discount found',
    type: ResponseDiscountDto,
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
    description: 'Discount not found',
  })
  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.discountService.findOne(id);
  }

  /**
   * Creates a new discount.
   *
   * @param payload - Data required to create a new discount
   * @param userId - ID of the authenticated user creating the discount
   * @returns Created Discount object
   * @throws ConflictException if discount name already exists
   * @throws BadRequestException if validation fails
   *
   * @endpoint POST /discount
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Create a new discount',
    description: 'Creates a new discount. The discount name must be unique.',
  })
  @ApiResponse({
    status: 201,
    description: 'Discount successfully created',
    type: ResponseDiscountDto,
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
    description: 'Conflict - Discount name already exists',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() payload: CreateDiscountDto, @UserId() userId: number) {
    return this.discountService.create(payload, userId);
  }

  /**
   * Updates an existing discount.
   *
   * @param id - Identifier of the discount to update
   * @param payload - Data to update the discount
   * @param userId - ID of the authenticated user updating the discount
   * @returns Updated Discount object
   * @throws NotFoundException if discount does not exist
   *
   * @endpoint PATCH /discount/:id
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Update a discount',
    description: 'Updates an existing discount. Supports partial updates.',
  })
  @ApiParam({
    name: 'id',
    description: 'Discount ID to update',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Discount successfully updated',
    type: ResponseDiscountDto,
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
    description: 'Discount not found',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateDiscountDto,
    @UserId() userId: number,
  ) {
    return this.discountService.update(id, userId, payload);
  }

  /**
   * Soft deletes a discount by marking it as deleted.
   *
   * @param id - Identifier of the discount to delete
   * @param userId - ID of the authenticated user performing the deletion
   * @returns Success message
   * @throws NotFoundException if discount does not exist
   *
   * @endpoint DELETE /discount/:id
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Delete a discount',
    description:
      'Soft deletes a discount by marking it as deleted. The discount is not permanently removed.',
  })
  @ApiParam({
    name: 'id',
    description: 'Discount ID to delete',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Discount successfully deleted',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'The Discount with ID: 1 has been deleted',
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
    description: 'Discount not found',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.discountService.remove(id, userId);
  }
}
