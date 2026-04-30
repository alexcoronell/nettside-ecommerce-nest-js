import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductImagesService } from '@product_images/product-images.service';
import { ProductImage } from '@product_images/entities/product-image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductImage])],
  providers: [ProductImagesService],
})
export class ProductImagesModule {}
