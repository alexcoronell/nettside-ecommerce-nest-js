/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// auth.controller.ts
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';

/* Services */
import { AuthService } from './auth.service';

/* Guards */
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';

/* Decorators */
import { NoAudit } from '@commons/decorators/no-audit.decorator';

/* Interfaces */
import { PayloadToken } from './interfaces/token.interface';

/**
 * Authentication Controller
 * Handles user authentication endpoints using httpOnly cookies
 *
 * **Security Features:**
 * - httpOnly cookies prevent XSS attacks
 * - Secure flag ensures HTTPS in production
 * - SameSite prevents CSRF attacks
 */
@NoAudit()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * User login endpoint
   *
   * **Flow:**
   * 1. LocalAuthGuard validates credentials
   * 2. User object is attached to request
   * 3. AuthService generates tokens and sets httpOnly cookies
   *
   * **Changes from Bearer token approach:**
   * - Tokens are now stored in httpOnly cookies instead of response body
   * - Frontend doesn't need to handle token storage
   * - More secure against XSS attacks
   *
   * @param req - Express Request containing validated user
   * @param response - Express Response to set cookies
   * @returns Success response with user data (no tokens in body)
   *
   * @example
   * // Frontend request:
   * fetch('/auth/login', {
   *   method: 'POST',
   *   credentials: 'include', // Important for cookies
   *   body: JSON.stringify({ email, password })
   * });
   */
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login (HttpOnly Cookie strategy)',
    description:
      'Authenticates user and sets access_token and refresh_token in httpOnly cookies',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Cookies are set automatically.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req: Request, @Res({ passthrough: true }) response: Response) {
    const { user } = req as any;
    return this.authService.login(user, response);
  }

  /**
   * Refresh access token endpoint
   *
   * **Purpose:**
   * When the access token expires (15 minutes), this endpoint generates
   * a new one using the refresh token from the cookie
   *
   * **Changes:**
   * - Now extracts refresh token from httpOnly cookie
   * - Validates user still exists and is active
   * - Better error handling
   *
   * @param req - Express Request containing refresh_token cookie
   * @param response - Express Response to set new access_token cookie
   * @returns Success message
   * @throws UnauthorizedException if refresh token is missing or invalid
   *
   * @example
   * // Frontend request (automatic retry on 401):
   * fetch('/auth/refresh', {
   *   method: 'POST',
   *   credentials: 'include' // Sends cookies
   * });
   */
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Uses refresh_token from httpOnly cookie to generate new access_token',
  })
  @ApiResponse({
    status: 200,
    description:
      'Token refreshed successfully. New access_token cookie is set.',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token missing, invalid, or expired',
  })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refreshToken(req, response);
  }

  /**
   * Logout endpoint
   * Clears all authentication cookies
   *
   * **Optional:** Can add JwtAuthGuard to require authentication
   * Currently allows logout without authentication for flexibility
   *
   * @param response - Express Response to clear cookies
   * @returns Success message
   *
   * @example
   * // Frontend request:
   * fetch('/auth/logout', {
   *   method: 'POST',
   *   credentials: 'include'
   * });
   */
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description: 'Clears access_token and refresh_token cookies',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully. Cookies are cleared.',
  })
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }

  /**
   * Get current user profile
   * Protected endpoint that requires valid access token
   *
   * **Purpose:**
   * Allows frontend to check if user is authenticated and get user data
   *
   * @param req - Express Request with user payload from JWT
   * @returns Current user data from token
   *
   * @example
   * // Frontend request:
   * fetch('/auth/me', {
   *   method: 'GET',
   *   credentials: 'include'
   * });
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Returns user data from JWT token in cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user payload from token',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - access token missing or invalid',
  })
  getProfile(@Req() req: Request) {
    const user = (req as any).user as PayloadToken;

    return {
      statusCode: HttpStatus.OK,
      data: user,
    };
  }
}
