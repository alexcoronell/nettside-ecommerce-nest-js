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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';

/* Services */
import { BrandService } from '@brand/brand.service';
import { UploadService } from '@upload/upload.service';

/* Decorators */
import { UserId } from '@auth/decorators/user-id.decorator';

/* DTO's */
import { CreateBrandDto } from '@brand/dto/create-brand.dto';
import { UpdateBrandDto } from '@brand/dto/update-brand.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';

/**
 * Controller for managing brand-related operations.
 * Implements the IBaseController interface to handle basic CRUD operations.
 *
 * @remarks
 * This controller exposes endpoints to count, list, create, update, and delete brands,
 * as well as to search brands by ID or name.
 */
@ApiTags('Brands')
@Controller('brand')
export class BrandController {
  constructor(
    private readonly brandService: BrandService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Gets the count of active brands.
   * @returns Number of active brands.
   */
  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get('count')
  count() {
    return this.brandService.count();
  }

  /**
   * Retrieves the list of all brands with optional pagination and search.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns Array of Brand objects or paginated result.
   */
  @ApiOperation({ summary: 'Get all brands with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of brands',
  })
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.brandService.findAll(paginationDto);
  }

  /**
   * Finds a brand by its unique identifier.
   * @param id Numeric identifier of the brand.
   * @returns Brand object corresponding to the provided ID.
   */
  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandService.findOne(id);
  }

  /**
   * Creates a new brand with the provided data.
   * @param payload Data required to create a new brand.
   * @param file Optional logo file for the brand.
   * @param userId ID of the user creating the brand.
   * @returns Created Brand object.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() payload: CreateBrandDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @UserId() userId: number,
  ) {
    let logoUrl: string | undefined;

    if (file) {
      const uploadResult = await this.uploadService.uploadLogo(file);
      logoUrl = uploadResult.url;
    }

    const createPayload = logoUrl ? { ...payload, logo: logoUrl } : payload;

    return this.brandService.create(createPayload, userId);
  }

  /**
   * Updates an existing brand with the provided data.
   * @param id Identifier of the brand to update.
   * @param updateCategoryDto Data to update the brand.
   * @param file Optional new logo file for the brand.
   * @param userId ID of the user updating the brand.
   * @returns Updated Brand object.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateBrandDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @UserId() userId: number,
  ) {
    let logoUrl: string | undefined;

    if (file) {
      const uploadResult = await this.uploadService.uploadLogo(file);
      logoUrl = uploadResult.url;
    }

    return this.brandService.update(id, userId, {
      ...updateCategoryDto,
      ...(logoUrl !== undefined && { logo: logoUrl }),
    });
  }

  /**
   * Deletes a brand by its identifier.
   * @param id Identifier of the brand to delete.
   * @param req
   * @returns Result of the delete operation.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.brandService.remove(+id, userId);
  }
}
