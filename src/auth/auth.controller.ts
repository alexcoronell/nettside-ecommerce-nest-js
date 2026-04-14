/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

/**
 * @fileoverview AuthController - HTTP Authentication Controller
 *
 * This controller exposes authentication endpoints:
 * - POST /auth/login - Login user
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - Logout user
 * - GET /auth/me - Get current user
 *
 * @module AuthController
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

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
 *
 * Handles HTTP authentication endpoints using secure httpOnly cookies.
 * All methods return standard JSON responses.
 *
 * @class AuthController
 * @extends Controller
 *
 * @example
 * // Frontend calls
 * // Login
 * fetch('/auth/login', {
 *   method: 'POST',
 *   credentials: 'include',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email: 'user@test.com', password: 'password' })
 * });
 *
 * // Refresh token (called automatically before 15 min)
 * fetch('/auth/refresh', {
 *   method: 'POST',
 *   credentials: 'include'
 * });
 *
 * // Logout
 * fetch('/auth/logout', {
 *   method: 'POST',
 *   credentials: 'include'
 * });
 *
 * // Get current user
 * fetch('/auth/me', {
 *   method: 'GET',
 *   credentials: 'include'
 * });
 */
@NoAudit()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  /**
   * AuthController Constructor
   *
   * @constructor
   * @param {AuthService} authService - Injected authentication service
   */
  constructor(private authService: AuthService) {}

  /**
   * Login endpoint
   *
   * Authenticates user and sets httpOnly cookies with tokens.
   * Uses LocalAuthGuard for credential validation.
   *
   * @method login
   * @post /auth/login
   * @ HttpCode(HttpStatus.OK)
   * @param {Request} req - Request with user validated by LocalAuthGuard
   * @param {Response} response - Response to set cookies
   * @returns {Promise<Object>} Validated user (no tokens in body)
   *
   * @api
   * @apiName AuthController_login
   * @apiDescription Authenticates user and sets httpOnly cookies
   * @apiVersion 1.0.0
   *
   * @apiParam {String} email User email
   * @apiParam {String} password User password
   *
   * @apiSuccess {Number} statusCode 200
   * @apiSuccess {Object} data Authenticated user
   * @apiSuccess {String} message Success message
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *   "statusCode": 200,
   *   "data": { "id": 1, "email": "user@test.com", "role": "ADMIN" },
   *   "message": "Logged in successfully"
   * }
   *
   * @apiError {Number} statusCode 401
   * @apiError {String} message Invalid credentials
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
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user } = req as any;
    return await this.authService.login(user, response);
  }

  /**
   * Refresh endpoint
   *
   * Uses refresh token from httpOnly cookie to generate
   * new access token without credentials.
   *
   * @method refresh
   * @post /auth/refresh
   * @ HttpCode(HttpStatus.OK)
   * @param {Request} req - Request with refresh_token cookie
   * @param {Response} response - Response for new access token
   * @returns {Object} Success message
   *
   * @api
   * @apiName AuthController_refresh
   * @apiDescription Refreshes access token using refresh token
   * @apiVersion 1.0.0
   *
   * @apiHeader {Cookie} refresh_token httpOnly cookie with refresh token
   *
   * @apiSuccess {Number} statusCode 200
   * @apiSuccess {String} message Token refreshed
   *
   * @apiError {Number} statusCode 401
   * @apiError {String} message Token invalid or expired
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
   *
   * Clears all authentication cookies.
   *
   * @method logout
   * @post /auth/logout
   * @ HttpCode(HttpStatus.OK)
   * @param {Response} response - Response to clear cookies
   * @returns {Object} Success message
   *
   * @api
   * @apiName AuthController_logout
   * @apiDescription Logout user and clear cookies
   * @apiVersion 1.0.0
   *
   * @apiSuccess {Number} statusCode 200
   * @apiSuccess {String} message Logged out
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
   * Get current user endpoint
   *
   * Returns user data from JWT token payload.
   * Requires valid access token.
   *
   * @method getProfile
   * @get /auth/me
   * @param {Request} req - Request with user from JWT
   * @returns {Object} User data from token
   *
   * @api
   * @apiName AuthController_getProfile
   * @apiDescription Gets current user from token
   * @apiVersion 1.0.0
   *
   * @apiHeader {Cookie} access_token httpOnly cookie with access token
   *
   * @apiSuccess {Number} statusCode 200
   * @apiSuccess {Object} data Token payload
   *
   * @apiError {Number} statusCode 401
   * @apiError {String} message Unauthorized
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = (req as any)['user'] as PayloadToken;

    return {
      statusCode: HttpStatus.OK,
      data: user,
    };
  }
}
