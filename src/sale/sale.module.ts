import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { Sale } from './entities/sale.entity';
import { SaleDetail } from '@sale_detail/entities/sale-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleDetail])],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule {}
