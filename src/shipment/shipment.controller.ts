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
} from '@nestjs/common';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';

/* Interface */
import { IBaseController } from '@commons/interfaces/i-base-controller';

/* Decorators */
import { UserId } from '@auth/decorators/user-id.decorator';

/* Services */
import { ShipmentService } from './shipment.service';

/* Entities */
import { Shipment } from './entities/shipment.entity';

/* DTO's */
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('shipment')
export class ShipmentController
  implements IBaseController<Shipment, CreateShipmentDto, UpdateShipmentDto>
{
  constructor(private readonly shipmentService: ShipmentService) {}

  @Get('count-all')
  countAll() {
    return this.shipmentService.countAll();
  }

  @Get('count')
  count() {
    return this.shipmentService.count();
  }

  @Get()
  findAll() {
    return this.shipmentService.findAll();
  }

  @Get('shipping-company/:id')
  findAllByShippingCompanyId(@Param('id', ParseIntPipe) id: number) {
    return this.shipmentService.findAllByShippingCompanyId(+id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shipmentService.findOne(+id);
  }

  @Get('tracking-number/:tracking')
  findOneByTrackingNumber(@Param('tracking') tracking: string) {
    return this.shipmentService.findOneByTrackingNumber(tracking);
  }

  @Get('sale/:id')
  findOneBySaleId(@Param('id', ParseIntPipe) id: number) {
    return this.shipmentService.findOneBySaleId(+id);
  }

  @Post()
  create(@Body() payload: CreateShipmentDto, @UserId() userId: number) {
    return this.shipmentService.create(payload, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() changes: UpdateShipmentDto,
  ) {
    return this.shipmentService.update(+id, userId, changes);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.shipmentService.remove(+id, userId);
  }
}
