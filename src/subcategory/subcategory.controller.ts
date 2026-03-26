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
import { SubcategoryService } from './subcategory.service';

/* Entity */
import { Subcategory } from './entities/subcategory.entity';

/* DTO's */
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';

@Controller('subcategory')
export class SubcategoryController
  implements
    IBaseController<Subcategory, CreateSubcategoryDto, UpdateSubcategoryDto>
{
  constructor(private readonly subcategoryService: SubcategoryService) {}

  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get('count-all')
  countAll() {
    return this.subcategoryService.countAll();
  }

  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get('count')
  count() {
    return this.subcategoryService.count();
  }

  /**
   * Retrieves a list of all subcategories with optional pagination and search.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns Array of Subcategory objects or paginated result.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiTags('Subcategories')
  @ApiOperation({ summary: 'Get all subcategories with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of subcategories',
  })
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.subcategoryService.findAll(paginationDto);
  }

  @Get('category/:category')
  findAllByCategory(@Param('category', ParseIntPipe) category: number) {
    return this.subcategoryService.findAllByCategory(category);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subcategoryService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('name/:name')
  findOneByName(@Param('name') name: string) {
    return this.subcategoryService.findOneByName(name);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('slug/:slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.subcategoryService.findOneBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() payload: CreateSubcategoryDto, @UserId() userId: number) {
    return this.subcategoryService.create(payload, userId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() changes: UpdateSubcategoryDto,
  ) {
    return this.subcategoryService.update(+id, userId, changes);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.subcategoryService.remove(+id, userId);
  }
}
