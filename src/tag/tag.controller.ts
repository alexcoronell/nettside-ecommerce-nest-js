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
import { TagService } from './tag.service';

/* Entities */
import { Tag } from './entities/tag.entity';

/* DTO's */
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';

@Controller('tag')
export class TagController
  implements IBaseController<Tag, CreateTagDto, UpdateTagDto>
{
  constructor(private readonly tagService: TagService) {}

  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get('count')
  count() {
    return this.tagService.count();
  }

  /**
   * Retrieves a list of all tags with optional pagination and search.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns Array of Tag objects or paginated result.
   */
  @ApiTags('Tags')
  @ApiOperation({ summary: 'Get all tags with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of tags',
  })
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.tagService.findAll(paginationDto);
  }

  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tagService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() payload: CreateTagDto, @UserId() userId: number) {
    return this.tagService.create(payload, userId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() updateCategoryDto: UpdateTagDto,
  ) {
    return this.tagService.update(+id, userId, updateCategoryDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.tagService.remove(+id, userId);
  }
}
