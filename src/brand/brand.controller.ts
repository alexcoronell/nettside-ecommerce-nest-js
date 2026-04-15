/**
 * @fileoverview BrandController - Controller for brand management
 *
 * Handles HTTP requests for brand CRUD operations.
 * All endpoints return ResponseBrandDto for consistent API responses.
 *
 * @module BrandController
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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

/* Swagger */
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

/* Services */
import { BrandService } from '@brand/brand.service';
import { UploadService } from '@upload/upload.service';

/* Decorators */
import { UserId } from '@auth/decorators/user-id.decorator';

/* DTO's */
import { CreateBrandDto } from '@brand/dto/create-brand.dto';
import { UpdateBrandDto } from '@brand/dto/update-brand.dto';
import { ResponseBrandDto } from '@brand/dto/response-brand.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';

/**
 * Controller for managing brand-related operations.
 *
 * @description
 * Provides endpoints for:
 * - Counting active brands
 * - Listing brands with pagination and search
 * - Finding brands by ID or slug
 * - Creating, updating, and deleting brands
 *
 * @example
 * // Base endpoint: /brand
 * // All protected endpoints require JWT authentication
 * // Admin-only endpoints additionally require admin role
 */
@ApiTags('Brands')
@Controller('brand')
export class BrandController {
  constructor(
    private readonly brandService: BrandService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Gets the count of active (non-deleted) brands.
   *
   * @returns Object containing the total count of active brands
   * @throws UnauthorizedException if user is not authenticated
   * @throws ForbiddenException if user is a customer
   *
   * @endpoint GET /brand/count
   * @security JWT + Non-customer role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Count active brands',
    description:
      'Returns the total number of active (non-deleted) brands in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'Total count of active brands',
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
    return this.brandService.count();
  }

  /**
   * Retrieves all active brands with optional pagination and search.
   *
   * @param paginationDto - Optional pagination parameters (page, limit, search, sortBy, sortOrder)
   * @returns Paginated list of active brands
   *
   * @endpoint GET /brand
   * @public
   */
  @ApiOperation({
    summary: 'Get all brands',
    description:
      'Returns a paginated list of active brands. Supports pagination, search by name/slug, and sorting.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of brands',
    type: ResponseBrandDto,
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
    description: 'Search term to filter brands by name or slug',
    type: String,
    example: 'nike',
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
    return this.brandService.findAll(paginationDto);
  }

  /**
   * Finds a brand by its unique identifier.
   *
   * @param id - Numeric identifier of the brand
   * @returns Brand object corresponding to the provided ID
   * @throws NotFoundException if brand with given ID does not exist
   *
   * @endpoint GET /brand/:id
   * @security JWT + Non-customer role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get brand by ID',
    description: 'Retrieves a single brand by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Brand ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Brand found',
    type: ResponseBrandDto,
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
    description: 'Brand not found',
  })
  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandService.findOne(id);
  }

  /**
   * Finds a brand by its slug.
   *
   * @param slug - Slug identifier of the brand
   * @returns Brand object corresponding to the provided slug
   * @throws NotFoundException if brand with given slug does not exist
   *
   * @endpoint GET /brand/slug/:slug
   * @public
   */
  @ApiOperation({
    summary: 'Get brand by slug',
    description: 'Retrieves a single brand by its URL-friendly slug.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Brand slug (URL-friendly identifier)',
    type: String,
    example: 'nike',
  })
  @ApiResponse({
    status: 200,
    description: 'Brand found',
    type: ResponseBrandDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
  })
  @Get('slug/:slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.brandService.findOneBySlug(slug);
  }

  /**
   * Creates a new brand.
   *
   * @param payload - Data required to create a new brand
   * @param file - Optional logo file for the brand (image)
   * @param userId - ID of the authenticated user creating the brand
   * @returns Created Brand object
   * @throws ConflictException if brand name already exists
   * @throws BadRequestException if validation fails
   *
   * @endpoint POST /brand
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Create a new brand',
    description:
      'Creates a new brand with optional logo upload. Requires admin privileges.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'file',
    description: 'Brand logo image (optional)',
    required: false,
    type: 'file',
  })
  @ApiResponse({
    status: 201,
    description: 'Brand successfully created',
    type: ResponseBrandDto,
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
    description: 'Conflict - Brand name already exists',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() payload: CreateBrandDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @UserId() userId: number,
  ) {
    let logoUrl: string | undefined;

    if (file) {
      const uploadResult = await this.uploadService.uploadLogo(file);
      logoUrl = uploadResult.url;
    }

    const createPayload = logoUrl ? { ...payload, logo: logoUrl } : payload;

    return this.brandService.create(createPayload, userId);
  }

  /**
   * Updates an existing brand.
   *
   * @param id - Identifier of the brand to update
   * @param payload - Data to update the brand
   * @param file - Optional new logo file for the brand
   * @param userId - ID of the authenticated user updating the brand
   * @returns Updated Brand object
   * @throws NotFoundException if brand does not exist
   * @throws ConflictException if new name already exists
   *
   * @endpoint PATCH /brand/:id
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Update a brand',
    description:
      'Updates an existing brand. Supports partial updates and optional logo replacement.',
  })
  @ApiParam({
    name: 'id',
    description: 'Brand ID to update',
    type: Number,
    example: 1,
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'file',
    description: 'New brand logo image (optional)',
    required: false,
    type: 'file',
  })
  @ApiResponse({
    status: 200,
    description: 'Brand successfully updated',
    type: ResponseBrandDto,
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
    description: 'Brand not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Brand name already exists',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateBrandDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @UserId() userId: number,
  ) {
    return this.brandService.update(id, userId, payload, file);
  }

  /**
   * Soft deletes a brand by marking it as deleted.
   *
   * @param id - Identifier of the brand to delete
   * @param userId - ID of the authenticated user performing the deletion
   * @returns Success message
   * @throws NotFoundException if brand does not exist
   *
   * @endpoint DELETE /brand/:id
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Delete a brand',
    description:
      'Soft deletes a brand by marking it as deleted. The brand is not permanently removed.',
  })
  @ApiParam({
    name: 'id',
    description: 'Brand ID to delete',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Brand successfully deleted',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'The Brand with ID: 1 has been deleted',
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
    description: 'Brand not found',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.brandService.remove(id, userId);
  }
}
