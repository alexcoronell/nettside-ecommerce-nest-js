import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

/* Decorators */
import { UserId } from '@auth/decorators/user-id.decorator';

/* Services */
import { SaleService } from './sale.service';

/* DTO's */
import { CreateSaleDto } from './dto/create-sale.dto';

/* Guards */
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sale')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @UseGuards(AdminGuard)
  @Get('count-all')
  countAll() {
    return this.saleService.countAll();
  }

  @UseGuards(AdminGuard)
  @Get('count')
  count() {
    return this.saleService.count();
  }

  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.saleService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get('user/:userId')
  findAllByUser(@Param('userId') userId: number) {
    return this.saleService.findAllByUser(userId);
  }

  @UseGuards(AdminGuard)
  @Get('payment-method/:paymentMethod')
  findAllByPaymentMethod(@Param('paymentMethodId') paymentMethodId: number) {
    return this.saleService.findAllByPaymentMethod(paymentMethodId);
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.saleService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateSaleDto, @UserId() userId: number) {
    return this.saleService.create(dto, userId);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  cancel(@Param('id') id: number, @UserId() userId: number) {
    return this.saleService.cancel(+id, userId);
  }
}
