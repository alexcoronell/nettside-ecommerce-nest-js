import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandService } from '@brand/brand.service';
import { BrandController } from '@brand/brand.controller';
import { Brand } from '@brand/entities/brand.entity';
import { UploadModule } from '@upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([Brand]), UploadModule],
  controllers: [BrandController],
  providers: [BrandService],
})
export class BrandModule {}
