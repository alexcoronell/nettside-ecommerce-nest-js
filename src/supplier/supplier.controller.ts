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

/* Entities */
import { Supplier } from './entities/supplier.entity';

/* DTO's */
import { CreateSupplierDto } from './dto/create-supplier.dto';
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
  implements IBaseController<Supplier, CreateSupplierDto, UpdateSupplierDto>
{
  /**
   * Creates an instance of SupplierController.
   * @param supplierService - The service used to manage supplier operations.
   */
  constructor(private readonly supplierService: SupplierService) {}

  /**
   * Returns the total count of all suppliers, including those that may be soft-deleted or inactive.
   * @returns The total number of suppliers.
   */
  //@UseGuards(JwtAuthGuard, AdminGuard)
  @Get('count-all')
  countAll() {
    return this.supplierService.countAll();
  }

  /**
   * Returns the count of active suppliers.
   * @returns The number of active suppliers.
   */
  @Get('count')
  count() {
    return this.supplierService.count();
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
   * Retrieves a supplier by its name.
   * @param name - The name of the supplier.
   * @returns The supplier entity if found.
   */
  @Get('name/:name')
  findOneByname(@Param('name') name: string) {
    return this.supplierService.findOneByName(name);
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
