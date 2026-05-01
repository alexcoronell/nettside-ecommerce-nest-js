import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';

import { ProductImagesModule } from '@product_images/product-images.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), ProductImagesModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
