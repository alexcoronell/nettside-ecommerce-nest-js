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
import { SupplierService } from './supplier.service';

/* DTO's */
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ResponseSupplierDto } from './dto/response-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('supplier')
/**
 * Controller responsible for handling supplier-related HTTP requests.
 * Implements the IBaseController interface for Supplier entities.
 *
 * @remarks
 * This controller provides endpoints to create, read, update, and delete suppliers,
 * as well as additional endpoints for counting and searching suppliers by name.
 */
export class SupplierController
  implements
    IBaseController<ResponseSupplierDto, CreateSupplierDto, UpdateSupplierDto>
{
  /**
   * Creates an instance of SupplierController.
   * @param supplierService - The service used to manage supplier operations.
   */
  constructor(private readonly supplierService: SupplierService) {}

  /**
   * Returns the count of active suppliers.
   * @returns The number of active suppliers.
   */
  @Get('count')
  count() {
    return this.supplierService.count();
  }

  /**
   * Retrieves all active subcategory names without pagination or filters.
   *
   * @returns Array of subcategory names only
   *
   * @endpoint GET /subcategory/all
   * @public
   */
  @ApiOperation({
    summary: 'Get all supplier names (no pagination)',
    description:
      'Returns a complete list of all active supplier names without pagination or filters. Ordered by name ASC.',
  })
  @ApiResponse({
    status: 200,
    description: 'Complete list of supplier names',
    type: ResponseSupplierDto,
    isArray: true,
  })
  @Get('all')
  findAllNoPagination() {
    return this.supplierService.findAllNoPagination();
  }

  /**
   * Retrieves a list of all suppliers with optional pagination and search.
   *
   * @param paginationDto - Optional pagination and search parameters.
   * @returns Array of Supplier objects or paginated result.
   */
  @ApiTags('Suppliers')
  @ApiOperation({ summary: 'Get all suppliers with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of suppliers',
  })
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.supplierService.findAll(paginationDto);
  }

  /**
   * Retrieves a supplier by its unique identifier.
   * @param id - The unique identifier of the supplier.
   * @returns The supplier entity if found.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.findOne(+id);
  }

  /**
   * Creates a new supplier.
   * @param payload - The data transfer object containing supplier creation data.
   * @returns The created supplier entity.
   */
  @Post()
  create(@Body() payload: CreateSupplierDto, @UserId() userId: number) {
    return this.supplierService.create(payload, userId);
  }

  /**
   * Updates an existing supplier by its unique identifier.
   * @param id - The unique identifier of the supplier to update.
   * @param updateCategoryDto - The data transfer object containing updated supplier data.
   * @returns The updated supplier entity.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() updateCategoryDto: UpdateSupplierDto,
  ) {
    return this.supplierService.update(+id, userId, updateCategoryDto);
  }

  /**
   * Removes a supplier by its unique identifier.
   * @param id - The unique identifier of the supplier to remove.
   * @returns The result of the remove operation.
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.supplierService.remove(+id, userId);
  }
}
