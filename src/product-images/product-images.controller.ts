import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/* Interface */
import { IBaseController } from '@commons/interfaces/i-base-controller';

/* Decorators */
import { UserId } from '@auth/decorators/user-id.decorator';

/* Services */
import { ProductImagesService } from '@product_images/product-images.service';

/* Entities */
import { ProductImage } from './entities/product-image.entity';

/* DTO's */
import { CreateProductImageDto } from '@product_images/dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

@Controller('product-images')
export class ProductImagesController
  implements
    IBaseController<ProductImage, CreateProductImageDto, UpdateProductImageDto>
{
  constructor(private readonly productImagesService: ProductImagesService) {}

  @Get('count-all')
  countAll() {
    return this.productImagesService.countAll();
  }

  @Get('count')
  count() {
    return this.productImagesService.count();
  }

  /**
   * Retrieves a list of all product images with optional pagination and search.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns Array of ProductImage objects or paginated result.
   */
  @ApiTags('Product Images')
  @ApiOperation({ summary: 'Get all product images with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of product images',
  })
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.productImagesService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productImagesService.findOne(+id);
  }

  @Post()
  create(@Body() payload: CreateProductImageDto, @UserId() userId: number) {
    return this.productImagesService.create(payload, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() updateProductImageDto: UpdateProductImageDto,
  ) {
    return this.productImagesService.update(+id, userId, updateProductImageDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productImagesService.remove(+id);
  }
}
