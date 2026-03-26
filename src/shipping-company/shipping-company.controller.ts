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

/* Entities */
import { ShippingCompany } from './entities/shipping-company.entity';

/* DTO's */
import { CreateShippingCompanyDto } from './dto/create-shipping-company.dto';
import { UpdateShippingCompanyDto } from './dto/update-shipping-company.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';

@UseGuards(JwtAuthGuard, IsNotCustomerGuard)
@Controller('shipping-company')
export class ShippingCompanyController
  implements
    IBaseController<
      ShippingCompany,
      CreateShippingCompanyDto,
      UpdateShippingCompanyDto
    >
{
  constructor(
    private readonly shippingCompanyService: ShippingCompanyService,
  ) {}

  @Get('count-all')
  countAll() {
    return this.shippingCompanyService.countAll();
  }

  @Get('count')
  count() {
    return this.shippingCompanyService.count();
  }

  /**
   * Retrieves a list of all shipping companies with optional pagination and search.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns Array of ShippingCompany objects or paginated result.
   */
  @ApiTags('Shipping Companies')
  @ApiOperation({ summary: 'Get all shipping companies with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of shipping companies',
  })
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.shippingCompanyService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shippingCompanyService.findOne(+id);
  }

  @Get('name/:name')
  findOneByname(@Param('name') name: string) {
    return this.shippingCompanyService.findOneByName(name);
  }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() payload: CreateShippingCompanyDto, @UserId() userId: number) {
    return this.shippingCompanyService.create(payload, userId);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() updateCategoryDto: UpdateShippingCompanyDto,
  ) {
    return this.shippingCompanyService.update(+id, userId, updateCategoryDto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.shippingCompanyService.remove(+id, userId);
  }
}
