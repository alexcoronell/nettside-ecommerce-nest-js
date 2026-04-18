/**
 * @fileoverview Sale Controller
 *
 * REST endpoints for Sale operations.
 * All endpoints require JWT authentication via cookies.
 * Admin endpoints require AdminGuard authorization.
 *
 * Authentication: JWT in httpOnly cookies (via JwtAuthGuard)
 * Authorization: Admin role required for most endpoints
 *
 * @module SaleController
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

/* Decorators */
import { UserId } from '@auth/decorators/user-id.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

/* Services */
import { SaleService } from './sale.service';

/* DTO's */
import { CreateSaleDto } from './dto/create-sale.dto';

/* Guards */
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';

/**
 * Controller for managing sales.
 *
 * All endpoints use JWT authentication via cookies.
 * The user ID is extracted from the JWT token cookie.
 *
 * @example
 * @UseGuards(JwtAuthGuard)
 * @Controller('sale')
 * export class SaleController {}
 */
@ApiBearerAuth('jwt')
@ApiTags('Sale')
@UseGuards(JwtAuthGuard)
@Controller('sale')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  /**
   * Counts all sales including cancelled ones.
   * Requires Admin role.
   *
   * @returns Object with total count
   */
  @ApiOperation({
    summary: 'Count all sales',
    description:
      'Returns total count of all sales including cancelled. Requires Admin role.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Total count returned' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing credentials',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  @UseGuards(AdminGuard)
  @Get('count-all')
  countAll() {
    return this.saleService.countAll();
  }

  /**
   * Counts only active (non-cancelled) sales.
   * Requires Admin role.
   *
   * @returns Object with total count
   */
  @ApiOperation({
    summary: 'Count active sales',
    description:
      'Returns total count of active (non-cancelled) sales. Requires Admin role.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Total count returned' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing credentials',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  @UseGuards(AdminGuard)
  @Get('count')
  count() {
    return this.saleService.count();
  }

  /**
   * Finds all active (non-cancelled) sales.
   * Requires Admin role.
   *
   * @returns Array of ResponseSaleDto
   */
  @ApiOperation({
    summary: 'Find all sales',
    description: 'Returns all active sales. Requires Admin role.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Array of sales returned',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing credentials',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.saleService.findAll();
  }

  /**
   * Finds all sales for a specific user.
   * Requires Admin role.
   *
   * @param userId - The user ID
   * @returns Array of ResponseSaleDto
   */
  @ApiOperation({
    summary: 'Find sales by user',
    description: 'Returns all sales for a specific user. Requires Admin role.',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Array of sales for user returned',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing credentials',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  @UseGuards(AdminGuard)
  @Get('user/:userId')
  findAllByUser(@Param('userId') userId: number) {
    return this.saleService.findAllByUser(userId);
  }

  /**
   * Finds all sales for a specific payment method.
   * Requires Admin role.
   *
   * @param paymentMethodId - The payment method ID
   * @returns Array of ResponseSaleDto
   */
  @ApiOperation({
    summary: 'Find sales by payment method',
    description:
      'Returns all sales for a specific payment method. Requires Admin role.',
  })
  @ApiParam({
    name: 'paymentMethodId',
    type: Number,
    description: 'Payment Method ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Array of sales for payment method returned',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing credentials',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  @UseGuards(AdminGuard)
  @Get('payment-method/:paymentMethod')
  findAllByPaymentMethod(@Param('paymentMethodId') paymentMethodId: number) {
    return this.saleService.findAllByPaymentMethod(paymentMethodId);
  }

  /**
   * Finds a single sale by ID.
   * Requires Admin role.
   *
   * @param id - The sale ID
   * @returns Single ResponseSaleDto
   */
  @ApiOperation({
    summary: 'Find sale by ID',
    description: 'Returns a single sale by ID. Requires Admin role.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Sale ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Sale returned' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Sale not found' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing credentials',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.saleService.findOne(+id);
  }

  /**
   * Creates a new sale.
   * Authenticated user is extracted from JWT cookie.
   *
   * @param dto - The create sale DTO
   * @param userId - The user ID (from JWT cookie)
   * @returns Created ResponseSaleDto
   */
  @ApiOperation({
    summary: 'Create a new sale',
    description: 'Creates a new sale. User extracted from JWT cookie.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Sale created' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid DTO' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing credentials',
  })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() dto: CreateSaleDto, @UserId() userId: number) {
    return this.saleService.create(dto, userId);
  }

  /**
   * Cancels an existing sale (soft delete).
   * Requires Admin role.
   *
   * @param id - The sale ID
   * @param userId - The user ID performing cancellation (from JWT cookie)
   * @returns Success message
   */
  @ApiOperation({
    summary: 'Cancel a sale',
    description: 'Cancels (soft deletes) a sale. Requires Admin role.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Sale ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sale cancelled successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Sale not found' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing credentials',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  @UseGuards(AdminGuard)
  @Delete(':id')
  cancel(@Param('id') id: number, @UserId() userId: number) {
    return this.saleService.cancel(+id, userId);
  }
}
