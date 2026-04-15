/**
 * @fileoverview PaymentMethodController - Controller for payment method management
 *
 * Handles HTTP requests for payment method CRUD operations.
 * All endpoints return ResponsePaymentMethodDto for consistent API responses.
 *
 * @module PaymentMethodController
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
import { PaymentMethodService } from '@payment_method/payment-method.service';

/* DTO's */
import { CreatePaymentMethodDto } from '@payment_method/dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from '@payment_method/dto/update-payment-method.dto';
import { ResponsePaymentMethodDto } from '@payment_method/dto/response-payment-method.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';

/**
 * Controller for managing payment method-related operations.
 *
 * @description
 * Provides endpoints for:
 * - Counting all and active payment methods
 * - Listing payment methods with pagination and search
 * - Finding payment methods by ID
 * - Creating, updating, and deleting payment methods
 *
 * @example
 * // Base endpoint: /payment-method
 * // All protected endpoints require JWT authentication
 * // Admin-only endpoints additionally require admin role
 */
@ApiTags('Payment Methods')
@Controller('payment-method')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  /**
   * Gets the count of all payment methods (including deleted).
   *
   * @returns Object containing the total count of all payment methods
   * @throws UnauthorizedException if user is not authenticated
   * @throws ForbiddenException if user is a customer
   *
   * @endpoint GET /payment-method/count-all
   * @security JWT + Non-customer role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Count all payment methods',
    description:
      'Returns the total number of all payment methods (including deleted ones).',
  })
  @ApiResponse({
    status: 200,
    description: 'Total count of all payment methods',
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
  @Get('count-all')
  countAll() {
    return this.paymentMethodService.countAll();
  }

  /**
   * Gets the count of active (non-deleted) payment methods.
   *
   * @returns Object containing the total count of active payment methods
   * @throws UnauthorizedException if user is not authenticated
   * @throws ForbiddenException if user is a customer
   *
   * @endpoint GET /payment-method/count
   * @security JWT + Non-customer role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Count active payment methods',
    description:
      'Returns the total number of active (non-deleted) payment methods in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'Total count of active payment methods',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        total: { type: 'number', example: 12 },
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
    return this.paymentMethodService.count();
  }

  /**
   * Retrieves all active payment methods with optional pagination and search.
   *
   * @param paginationDto - Optional pagination parameters (page, limit, search, sortBy, sortOrder)
   * @returns Paginated list of active payment methods
   *
   * @endpoint GET /payment-method
   * @security JWT + Non-customer role (Admin or Seller)
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get all payment methods',
    description:
      'Returns a paginated list of active payment methods. Supports pagination, search by name, and sorting.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of payment methods',
    type: ResponsePaymentMethodDto,
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
    description: 'Search term to filter payment methods by name',
    type: String,
    example: 'card',
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
  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.paymentMethodService.findAll(paginationDto);
  }

  /**
   * Finds a payment method by its unique identifier.
   *
   * @param id - Numeric identifier of the payment method
   * @returns PaymentMethod object corresponding to the provided ID
   * @throws NotFoundException if payment method with given ID does not exist
   *
   * @endpoint GET /payment-method/:id
   * @security JWT + Non-customer role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get payment method by ID',
    description: 'Retrieves a single payment method by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment Method ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment method found',
    type: ResponsePaymentMethodDto,
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
    description: 'Payment method not found',
  })
  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentMethodService.findOne(id);
  }

  /**
   * Creates a new payment method.
   *
   * @param payload - Data required to create a new payment method
   * @param userId - ID of the authenticated user creating the payment method
   * @returns Created PaymentMethod object
   * @throws ConflictException if payment method name already exists
   * @throws BadRequestException if validation fails
   *
   * @endpoint POST /payment-method
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Create a new payment method',
    description:
      'Creates a new payment method. The payment method name must be unique.',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment method successfully created',
    type: ResponsePaymentMethodDto,
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
    description: 'Conflict - Payment method name already exists',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() payload: CreatePaymentMethodDto, @UserId() userId: number) {
    return this.paymentMethodService.create(payload, userId);
  }

  /**
   * Updates an existing payment method.
   *
   * @param id - Identifier of the payment method to update
   * @param payload - Data to update the payment method
   * @param userId - ID of the authenticated user updating the payment method
   * @returns Updated PaymentMethod object
   * @throws NotFoundException if payment method does not exist
   *
   * @endpoint PATCH /payment-method/:id
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Update a payment method',
    description:
      'Updates an existing payment method. Supports partial updates.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment Method ID to update',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment method successfully updated',
    type: ResponsePaymentMethodDto,
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
    description: 'Payment method not found',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdatePaymentMethodDto,
    @UserId() userId: number,
  ) {
    return this.paymentMethodService.update(id, userId, payload);
  }

  /**
   * Soft deletes a payment method by marking it as deleted.
   *
   * @param id - Identifier of the payment method to delete
   * @param userId - ID of the authenticated user performing the deletion
   * @returns Success message
   * @throws NotFoundException if payment method does not exist
   *
   * @endpoint DELETE /payment-method/:id
   * @security JWT + Admin role
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Delete a payment method',
    description:
      'Soft deletes a payment method by marking it as deleted. The payment method is not permanently removed.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment Method ID to delete',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Payment method successfully deleted',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'The Payment Method with ID: 1 has been deleted',
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
    description: 'Payment method not found',
  })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.paymentMethodService.remove(id, userId);
  }
}
