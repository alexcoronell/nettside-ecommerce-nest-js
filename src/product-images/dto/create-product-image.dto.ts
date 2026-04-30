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
  product!: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  isActive!: boolean;
}
