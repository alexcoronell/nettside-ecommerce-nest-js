import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductTagService } from './product-tag.service';
import { ProductTagController } from './product-tag.controller';
import { ProductTag } from './entities/product-tag.entity';
import { Product } from '@product/entities/product.entity';
import { Tag } from '@tag/entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductTag, Product, Tag])],
  controllers: [ProductTagController],
  providers: [ProductTagService],
})
export class ProductTagModule {}
