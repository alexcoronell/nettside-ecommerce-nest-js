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
import { DiscountService } from '@discount/discount.service';

/* Entities */
import { Discount } from '@discount/entities/discount.entity';

/* DTO's */
import { CreateDiscountDto } from '@discount/dto/create-discount.dto';
import { UpdateDiscountDto } from '@discount/dto/update-discount.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, IsNotCustomerGuard)
@Controller('discount')
export class DiscountController
  implements IBaseController<Discount, CreateDiscountDto, UpdateDiscountDto>
{
  constructor(private readonly discountService: DiscountService) {}

  @Get('count-all')
  countAll() {
    return this.discountService.countAll();
  }

  @Get('count')
  count() {
    return this.discountService.count();
  }

  /**
   * Retrieves a list of all discounts with optional pagination and search.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns Array of Discount objects or paginated result.
   */
  @ApiTags('Discounts')
  @ApiOperation({ summary: 'Get all discounts with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of discounts',
  })
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.discountService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.discountService.findOne(+id);
  }

  @Get('code/:code')
  findOneByCode(@Param('code') code: string) {
    return this.discountService.findOneByCode(code);
  }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() payload: CreateDiscountDto, @UserId() userId: number) {
    return this.discountService.create(payload, userId);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() updateCategoryDto: UpdateDiscountDto,
  ) {
    return this.discountService.update(+id, userId, updateCategoryDto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.discountService.remove(+id, userId);
  }
}
