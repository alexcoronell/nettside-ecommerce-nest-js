import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

/* Modules */
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@auth/auth.module';
import { BrandModule } from '@brand/brand.module';
import { CategoryModule } from '@category/category.module';
import { PaymentMethodModule } from '@payment_method/payment-method.module';
import { SupplierModule } from '@supplier/supplier.module';
import { UserModule } from '@user/user.module';
import { ShippingCompanyModule } from './shipping-company/shipping-company.module';
import { TagModule } from './tag/tag.module';
import { StoreDetailModule } from './store-detail/store-detail.module';
import { SubcategoryModule } from './subcategory/subcategory.module';
import { ProductModule } from './product/product.module';
import { ProductImagesModule } from './product-images/product-images.module';
import { DiscountModule } from './discount/discount.module';
import { ProductTagModule } from './product-tag/product-tag.module';
import { ProductSupplierModule } from './product-supplier/product-supplier.module';
import { ProductDiscountModule } from './product-discount/product-discount.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { SaleModule } from './sale/sale.module';
import { SaleDetailModule } from './sale-detail/sale-detail.module';
import { PurchaseModule } from './purchase/purchase.module';
import { PurchaseDetailModule } from './purchase-detail/purchase-detail.module';
import { ShipmentModule } from './shipment/shipment.module';
import { UploadModule } from '@upload/upload.module';

/* Guards */
import { ApiKeyGuard } from '@commons/guards/api-key.guard';
import { BootstrapModule } from './bootstrap/bootstrap.module';

/* Config */
import config from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    UserModule,
    DatabaseModule,
    AuthModule,
    CategoryModule,
    BrandModule,
    SupplierModule,
    PaymentMethodModule,
    ShippingCompanyModule,
    TagModule,
    StoreDetailModule,
    SubcategoryModule,
    ProductModule,
    ProductImagesModule,
    DiscountModule,
    ProductTagModule,
    ProductSupplierModule,
    ProductDiscountModule,
    WishlistModule,
    SaleModule,
    SaleDetailModule,
    PurchaseModule,
    PurchaseDetailModule,
    ShipmentModule,
    UploadModule,
    BootstrapModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ApiKeyGuard }],
})
export class AppModule {}
