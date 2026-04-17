import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

/* Services */
import { StoreDetailService } from './store-detail.service';

/* Decorators */
import { UserId } from '@auth/decorators/user-id.decorator';

/* DTO's */
import { UpdateStoreDetailDto } from './dto/update-store-detail.dto';
import { ResponseStoreDetailDto } from './dto/response-store-detail.dto';

import { Result } from '@commons/types/result.type';

/* Guards */
import { AdminGuard } from '@auth/guards/admin-auth/admin-auth.guard';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';

@Controller('store-detail')
export class StoreDetailController {
  constructor(private readonly storeDetailService: StoreDetailService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Result<ResponseStoreDetailDto>> {
    return this.storeDetailService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Body() updateStoreDetailDto: UpdateStoreDetailDto,
  ): Promise<Result<ResponseStoreDetailDto>> {
    return this.storeDetailService.update(id, userId, updateStoreDetailDto);
  }
}
