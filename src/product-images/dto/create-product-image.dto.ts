import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@commons/decorators/trim.decorator';

import { Product } from '@product/entities/product.entity';
import { User } from '@user/entities/user.entity';

export class CreateProductImageDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  filePath!: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title!: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  isMain!: boolean;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  product!: Product;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  createdBy!: User;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  isActive!: boolean;
}
