import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BUCKETS } from '@upload/constants/storage.constants';

export class UploadFileDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  folder?: string;
}

export class UploadLogoDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ enum: BUCKETS })
  folder?: (typeof BUCKETS)[keyof typeof BUCKETS];
}
