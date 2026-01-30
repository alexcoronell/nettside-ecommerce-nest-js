import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

/* Services */
import { ProductTagService } from './product-tag.service';

/* Decorators */
import { UserId } from '@auth/decorators/user-id.decorator';

/* DTO's */
import { CreateProductTagDto } from './dto/create-product-tag.dto';

/* Guards */
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';

@Controller('product-tag')
export class ProductTagController {
  constructor(private readonly productTagService: ProductTagService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('count')
  countAll() {
    return this.productTagService.countAll();
  }

  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get()
  findAll() {
    return this.productTagService.findAll();
  }

  @Get('product/:id')
  findAllByProduct(@Param('id') id: number) {
    return this.productTagService.findAllByProduct(+id);
  }

  @Get('tag/:id')
  findAllByTag(@Param('id') id: number) {
    return this.productTagService.findAllByTag(+id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('one')
  findOne(@Body() criteria: Partial<{ productId: number; tagId: number }>) {
    return this.productTagService.findOne(criteria);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(
    @Body() createProductTagDto: CreateProductTagDto,
    @UserId() userId: number,
  ) {
    return this.productTagService.create(createProductTagDto, userId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('many')
  createMany(
    @Body() dtos: CreateProductTagDto | CreateProductTagDto[],
    @UserId() userId: number,
  ) {
    return this.productTagService.createMany(dtos, userId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete()
  delete(@Body() criteria: Partial<{ productId: number; tagId: number }>) {
    return this.productTagService.delete(criteria);
  }
}
