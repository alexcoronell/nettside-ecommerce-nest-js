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
import { PurchaseService } from './purchase.service';

/* Entities */
import { Purchase } from './entities/purchase.entity';

/* DTO's */
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PaginationDto } from '@commons/dtos/Pagination.dto';

/* Guards */
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';

@Controller('purchase')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PurchaseController
  implements IBaseController<Purchase, CreatePurchaseDto, UpdatePurchaseDto>
{
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get('count-all')
  countAll() {
    return this.purchaseService.countAll();
  }

  @Get('count')
  count() {
    return this.purchaseService.count();
  }

  /**
   * Retrieves a list of all purchases with optional pagination.
   *
   * @param paginationDto - Optional pagination parameters.
   * @returns Array of Purchase objects or paginated result.
   */
  @ApiTags('Purchases')
  @ApiOperation({ summary: 'Get all purchases with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of purchases',
  })
  @Get()
  findAll(@Query() paginationDto?: PaginationDto) {
    return this.purchaseService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseService.findOne(+id);
  }

  @Get('supplier/:id')
  findOneBySupplierId(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseService.findBySupplierId(id);
  }

  @Post()
  create(@Body() dto: CreatePurchaseDto, @UserId() userId: number) {
    return this.purchaseService.create(dto, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() updatePurchaseDto: UpdatePurchaseDto,
  ) {
    return this.purchaseService.update(+id, userId, updatePurchaseDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.purchaseService.remove(+id, userId);
  }
}
