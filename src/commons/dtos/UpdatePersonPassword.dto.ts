import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePersonPasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  readonly password: string;
}
