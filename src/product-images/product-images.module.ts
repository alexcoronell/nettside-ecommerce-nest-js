import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductImagesService } from '@product_images/product-images.service';
import { ProductImage } from '@product_images/entities/product-image.entity';
import { UploadModule } from '@upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProductImage]), UploadModule],
  providers: [ProductImagesService],
  exports: [ProductImagesService],
})
export class ProductImagesModule {}
