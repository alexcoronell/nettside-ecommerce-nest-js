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
import { ProductService } from './product.service';

/* DTO's */
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { ResponseProductDto } from './dto/response-product.dto';

@Controller('product')
export class ProductController
  implements
    IBaseController<ResponseProductDto, CreateProductDto, UpdateProductDto>
{
  constructor(private readonly productService: ProductService) {}

  @Get('count')
  count() {
    return this.productService.count();
  }

  /**
   * Retrieves a list of all products with optional pagination and search.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns Array of Product objects or paginated result.
   */
  @ApiTags('Products')
  @ApiOperation({ summary: 'Get all products with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of products',
  })
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.productService.findAll(paginationDto);
  }

  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(+id);
  }

  @Get('slug/:slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.productService.findOneBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() payload: CreateProductDto, @UserId() userId: number) {
    return this.productService.create(payload, userId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() updateCategoryDto: UpdateProductDto,
  ) {
    return this.productService.update(+id, userId, updateCategoryDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.productService.remove(+id, userId);
  }
}
