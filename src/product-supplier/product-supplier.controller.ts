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

/* Interfaces */
import { IBaseController } from '@commons/interfaces/i-base-controller';

/* Decorators */
import { UserId } from '@auth/decorators/user-id.decorator';

/* Services */
import { ProductSupplierService } from './product-supplier.service';

/* Entities */
import { ProductSupplier } from './entities/product-supplier.entity';

/* DTO's */
import { CreateProductSupplierDto } from './dto/create-product-supplier.dto';
import { UpdateProductSupplierDto } from './dto/update-product-supplier.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';

@Controller('product-supplier')
export class ProductSupplierController
  implements
    IBaseController<
      ProductSupplier,
      CreateProductSupplierDto,
      UpdateProductSupplierDto
    >
{
  constructor(
    private readonly productSupplierService: ProductSupplierService,
  ) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('count-all')
  countAll() {
    return this.productSupplierService.countAll();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('count')
  count() {
    return this.productSupplierService.count();
  }

  /**
   * Retrieves a list of all product suppliers with optional pagination and search.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns Array of ProductSupplier objects or paginated result.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiTags('Product Suppliers')
  @ApiOperation({ summary: 'Get all product suppliers with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of product suppliers',
  })
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.productSupplierService.findAll(paginationDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productSupplierService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('product/:id')
  findAllByProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productSupplierService.findAllByProduct(+id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('supplier/:id')
  findAllBySupplier(@Param('id', ParseIntPipe) id: number) {
    return this.productSupplierService.findAllBySupplier(+id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() payload: CreateProductSupplierDto, @UserId() userId: number) {
    return this.productSupplierService.create(payload, userId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() updateCategoryDto: UpdateProductSupplierDto,
  ) {
    return this.productSupplierService.update(+id, userId, updateCategoryDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.productSupplierService.remove(+id, userId);
  }
}
