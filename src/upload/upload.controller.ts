import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';

import { UploadService } from '@upload/upload.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth/jwt-auth.guard';
import { IsNotCustomerGuard } from '@auth/guards/is-not-customer/is-not-customer.guard';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a generic file' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  uploadGeneric(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    return this.uploadService.uploadFile(file, folder);
  }

  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Post('logo')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a brand logo' })
  @ApiResponse({ status: 201, description: 'Logo uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadLogo(file);
  }

  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Post('product')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a product image' })
  @ApiResponse({
    status: 201,
    description: 'Product image uploaded successfully',
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadProductImage(file);
  }

  @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
  @Post('avatar')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a user avatar' })
  @ApiResponse({ status: 201, description: 'Avatar uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadAvatar(file);
  }
}
