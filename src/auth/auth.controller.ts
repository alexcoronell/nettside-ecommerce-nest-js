/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

// External dependencies - NestJS core
import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

// External dependencies - Third-party
import { Request, Response } from 'express';

/* Services */
import { AuthService } from './auth.service';

/* Guards */
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';

/* Decorators */
import { NoAudit } from '@commons/decorators/no-audit.decorator';

@NoAudit()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login (HttpOnly Cookie strategy)',
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req: Request, @Res({ passthrough: true }) response: Response) {
    const { user } = req as any;
    return this.authService.login(user, response);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear auth cookies' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }
}
