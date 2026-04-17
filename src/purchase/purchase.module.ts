import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { Purchase } from './entities/purchase.entity';
import { PurchaseDetail } from '@purchase_detail/entities/purchase-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, PurchaseDetail])],
  controllers: [PurchaseController],
  providers: [PurchaseService],
})
export class PurchaseModule {}
