import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/* Decorators */
import { UserId } from '@auth/decorators/user-id.decorator';

/* Services */
import { ProductDiscountService } from './product-discount.service';

/* DTO's */
import { CreateProductDiscountDto } from './dto/create-product-discount.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';

@Controller('product-discount')
export class ProductDiscountController {
  constructor(
    private readonly productDiscountService: ProductDiscountService,
  ) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('count')
  count() {
    return this.productDiscountService.count();
  }

  /**
   * Retrieves a list of all product discounts with optional pagination.
   *
   * @param paginationDto - Optional pagination parameters.
   * @returns Array of ProductDiscount objects or paginated result.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiTags('Product Discounts')
  @ApiOperation({ summary: 'Get all product discounts with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of product discounts',
  })
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.productDiscountService.findAll(paginationDto);
  }

  @Get('product/:id')
  findAllByProduct(@Param('id') id: number) {
    return this.productDiscountService.findAllByProduct(+id);
  }

  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get('discount/:id')
  findAllByDiscount(@Param('id') id: number) {
    return this.productDiscountService.findAllByDiscount(+id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('one/:productId/:discountId')
  findOne(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('discountId', ParseIntPipe) discountId: number,
  ) {
    return this.productDiscountService.findOne(productId, discountId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(
    @Body() createProductDiscountDto: CreateProductDiscountDto,
    @UserId() userId: number,
  ) {
    return this.productDiscountService.create(createProductDiscountDto, userId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('many')
  createMany(
    @Body() dtos: CreateProductDiscountDto[],
    @UserId() userId: number,
  ) {
    return this.productDiscountService.createMany(dtos, userId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':productId/:discountId')
  delete(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('discountId', ParseIntPipe) discountId: number,
  ) {
    return this.productDiscountService.delete(productId, discountId);
  }
}
