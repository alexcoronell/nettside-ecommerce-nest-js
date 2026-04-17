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
import { ShippingCompanyService } from './shipping-company.service';

/* DTO's */
import { CreateShippingCompanyDto } from './dto/create-shipping-company.dto';
import { UpdateShippingCompanyDto } from './dto/update-shipping-company.dto';
import { ResponseShippingCompanyDto } from './dto/response-shipping-company.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Types */
import { Result } from '@commons/types/result.type';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';

@UseGuards(JwtAuthGuard, IsNotCustomerGuard)
@Controller('shipping-company')
export class ShippingCompanyController
  implements
    IBaseController<
      ResponseShippingCompanyDto,
      CreateShippingCompanyDto,
      UpdateShippingCompanyDto
    >
{
  constructor(
    private readonly shippingCompanyService: ShippingCompanyService,
  ) {}

  @Get('count')
  count() {
    return this.shippingCompanyService.count();
  }

  /**
   * Retrieves a list of all shipping companies with optional pagination and search.
   */
  @ApiTags('Shipping Companies')
  @ApiOperation({ summary: 'Get all shipping companies with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of shipping companies',
  })
  @Get()
  findAll(
    @Query() paginationDto?: PaginationDto,
  ): Promise<Result<ResponseShippingCompanyDto[]>> {
    return this.shippingCompanyService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Result<ResponseShippingCompanyDto>> {
    return this.shippingCompanyService.findOne(id);
  }

  @UseGuards(AdminGuard)
  @Post()
  create(
    @Body() payload: CreateShippingCompanyDto,
    @UserId() userId: number,
  ): Promise<Result<ResponseShippingCompanyDto>> {
    return this.shippingCompanyService.create(payload, userId);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() updateCategoryDto: UpdateShippingCompanyDto,
  ): Promise<Result<ResponseShippingCompanyDto>> {
    return this.shippingCompanyService.update(id, userId, updateCategoryDto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
  ): Promise<Result<ResponseShippingCompanyDto>> {
    return this.shippingCompanyService.remove(id, userId);
  }
}
