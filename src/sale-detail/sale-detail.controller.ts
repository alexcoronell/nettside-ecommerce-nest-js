import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

/* Services */
import { SaleDetailService } from './sale-detail.service';

/* DTO's */
import { CreateSaleDetailDto } from './dto/create-sale-detail.dto';

/* Guards */
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sale-detail')
export class SaleDetailController {
  constructor(private readonly saleDetailService: SaleDetailService) {}

  @UseGuards(AdminGuard)
  @Get('count')
  count() {
    return this.saleDetailService.count();
  }

  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.saleDetailService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.saleDetailService.findOne(id);
  }

  @UseGuards(AdminGuard)
  @Get('sale/:id')
  findBySaleId(@Param('id', ParseIntPipe) id: number) {
    return this.saleDetailService.findBySaleId(id);
  }

  @Post()
  create(@Body() payload: CreateSaleDetailDto[]) {
    return this.saleDetailService.create(payload);
  }
}
