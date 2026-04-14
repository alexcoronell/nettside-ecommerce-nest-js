import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/* Interface */
import { IBaseController } from '@commons/interfaces/i-base-controller';

/* Decorators */
import { UserId } from '@auth/decorators/user-id.decorator';

/* Services */
import { PaymentMethodService } from '@payment_method/payment-method.service';

/* Entities */
import { PaymentMethod } from './entities/payment-method.entity';

/* DTO's */
import { CreatePaymentMethodDto } from '@payment_method/dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from '@payment_method/dto/update-payment-method.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('payment-method')
/**
 * Controller for managing payment methods.
 *
 * Provides endpoints to create, retrieve, update, and delete payment methods.
 * Also includes endpoints for counting and searching payment methods by name.
 */
export class PaymentMethodController
  implements
    IBaseController<
      PaymentMethod,
      CreatePaymentMethodDto,
      UpdatePaymentMethodDto
    >
{
  /**
   * Constructs a new PaymentMethodController.
   * @param paymentMethodService The service used to manage payment methods.
   */
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  /**
   * Gets the total count of all payment methods, including inactive ones.
   * @returns The total number of payment methods.
   */
  @UseGuards(IsNotCustomerGuard)
  @Get('count-all')
  countAll() {
    return this.paymentMethodService.countAll();
  }

  /**
   * Gets the count of active payment methods.
   * @returns The number of active payment methods.
   */
  @UseGuards(IsNotCustomerGuard)
  @Get('count')
  count() {
    return this.paymentMethodService.count();
  }

  /**
   * Retrieves a list of all payment methods with optional pagination and search.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns Array of PaymentMethod objects or paginated result.
   */
  @ApiTags('Payment Methods')
  @ApiOperation({ summary: 'Get all payment methods with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of payment methods',
  })
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.paymentMethodService.findAll(paginationDto);
  }

  /**
   * Retrieves a payment method by its ID.
   * @param id The ID of the payment method.
   * @returns The payment method with the specified ID.
   */
  @UseGuards(IsNotCustomerGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentMethodService.findOne(+id);
  }

  /**
   * Creates a new payment method.
   * @param payload The data for the new payment method.
   * @returns The created payment method.
   */
  @UseGuards(AdminGuard)
  @Post()
  create(@Body() payload: CreatePaymentMethodDto, @UserId() userId: number) {
    return this.paymentMethodService.create(payload, userId);
  }

  /**
   * Updates an existing payment method.
   * @param id The ID of the payment method to update.
   * @param updateCategoryDto The updated data for the payment method.
   * @returns The updated payment method.
   */
  @UseGuards(AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() updateCategoryDto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodService.update(+id, userId, updateCategoryDto);
  }

  /**
   * Removes a payment method by its ID.
   * @param id The ID of the payment method to remove.
   * @returns The result of the removal operation.
   */
  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.paymentMethodService.remove(+id, userId);
  }
}
