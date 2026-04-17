import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseDetailService } from './purchase-detail.service';
import { PurchaseDetail } from './entities/purchase-detail.entity';

/**
 * PurchaseDetailModule - Internal module (no controller)
 *
 * This module is now internal to PurchaseModule. No endpoints exposed.
 * Purchase details are managed through Purchase service.
 *
 * @description
 * Provides PurchaseDetail entity and service for internal use only.
 * Used by PurchaseService to handle purchase details.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PurchaseDetail])],
  providers: [PurchaseDetailService],
  exports: [PurchaseDetailService],
})
export class PurchaseDetailModule {}
