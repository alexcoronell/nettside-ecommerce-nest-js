/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/**
 * @fileoverview AuthService - Authentication service with secure httpOnly cookies
 *
 * This service handles all user authentication logic,
 * including JWT/RefreshToken generation and secure cookie management.
 *
 * @module AuthService
 * @version 1.0.0
 * @author Nettside E-commerce Team
 *
 * @description
 * ### Main Features:
 * - User credential validation
 * - JWT access and RefreshToken generation
 * - Secure httpOnly cookie management
 * - Automatic token refresh
 *
 * ### Security Implemented:
 * - httpOnly: Prevents XSS by blocking JavaScript access
 * - secure: Only sent over HTTPS in production
 * - sameSite: CSRF protection
 * - maxAge: Precise expiration for each token
 *
 * @example
 * // Usage in controller
 * const result = await authService.login(user, response);
 * const tokens = await authService.generateJWT(user);
 * await authService.refreshToken(request, response);
 * authService.logout(response);
 */

import {
  Injectable,
  Inject,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
import * as bcrypt from 'bcrypt';

import config from '@config/index';
import { UserService } from '@user/user.service';
import { User } from '@user/entities/user.entity';
import { PayloadToken } from '@auth/interfaces/token.interface';

/**
 * Authentication Service
 *
 * Handles all authentication logic including:
 * - User validation
 * - Token generation and refresh
 * - Secure httpOnly cookie management
 *
 * @class AuthService
 * @extends Injectable
 *
 * @example
 * // Constructor injection
 * constructor(private authService: AuthService) {}
 */
@Injectable()
export class AuthService {
  /**
   * Secret key for signing refresh tokens
   * @private
   */
  jwtRefreshTokenSecret: string | null = null;

  /**
   * Refresh token expiration time in seconds
   * @private
   */
  jwtRefreshTokenExpirationTime: number | null = null;

  /**
   * Flag indicating production environment
   * @private
   */
  isProduction: boolean | undefined = undefined;

  /**
   * Domain for cookies (useful for subdomains)
   * @private
   */
  cookieDomain: string | undefined = undefined;

  /**
   * AuthService Constructor
   *
   * Initializes service with JWT and cookie config.
   * Extracts configuration parameters from config module.
   *
   * @constructor
   * @param {UserService} userService - User service for validation
   * @param {JwtService} jwtService - JWT service for signing tokens
   * @param {ConfigType<typeof config>} configService - Application configuration
   *
   * @example
   * // Required config:
   * {
   *   jwtSecret: 'secret-key',
   *   jwtRefreshTokenSecret: 'refresh-secret',
   *   isProduction: 'production',
   *   cookieDomain: '.mydomain.com'
   * }
   */
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @Inject(config.KEY) configService: ConfigType<typeof config>,
  ) {
    this.jwtRefreshTokenSecret = configService.jwtRefreshTokenSecret ?? null;
    this.jwtRefreshTokenExpirationTime =
      configService.jwtRefreshTokenExpirationTime as unknown as number;
    this.isProduction = configService.isProduction === 'production';
    this.cookieDomain = configService.cookieDomain;
  }

  /**
   * Validates user credentials
   *
   * Verifies email exists and password matches.
   * Returns user without password if valid.
   *
   * @async
   * @method validateUser
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<User|null>} Validated user or null if invalid
   * @throws {Error} If email does not exist
   *
   * @example
   * const user = await authService.validateUser('user@test.com', 'password123');
   * if (user) {
   *   // Valid user
   * }
   */
  async validateUser(email: string, password: string) {
    const { data } = await this.userService.findAndValidateEmail(email);
    const user = data as User;
    const isMatch = await bcrypt.compare(password, user.password);
    if (user && isMatch) {
      user.password = undefined;
      return user;
    }
    return null;
  }

  /**
   * Gets base options for secure cookies
   *
   * Generates common cookie options:
   * - httpOnly: true (prevents XSS)
   * - path: '/' (available app-wide)
   * - secure: true only in production
   * - sameSite: 'none' in production, 'lax' in dev
   *
   * @private
   * @method getCookieOptions
   * @returns {Object} Cookie options
   */
  private getCookieOptions() {
    const options: any = {
      httpOnly: true,
      path: '/',
      secure: this.isProduction, // Only true over HTTPS in production
      sameSite: this.isProduction ? 'none' : 'lax',
    };

    if (this.cookieDomain && this.cookieDomain !== '') {
      options.domain = this.cookieDomain;
    }

    return options;
  }

  /**
   * Sets access token cookie
   *
   * Configures httpOnly cookie with access token.
   * Expires in 15 minutes.
   *
   * @private
   * @method setAccessTokenCookie
   * @param {string} access_token - JWT access token
   * @param {Response} response - Express response object
   *
   * @example
   * this.setAccessTokenCookie('jwt-token', response);
   */
  private setAccessTokenCookie(access_token: string, response: Response) {
    const options = {
      ...this.getCookieOptions(),
      maxAge: 15 * 60 * 1000, // 15 minutes
    };
    response.cookie('access_token', access_token, options);
  }

  /**
   * Sets refresh token cookie
   *
   * Configures httpOnly cookie with refresh token.
   * Expires in 7 days.
   *
   * @private
   * @method setRefreshTokenCookie
   * @param {string} refresh_token - JWT refresh token
   * @param {Response} response - Express response object
   *
   * @example
   * this.setRefreshTokenCookie('refresh-token', response);
   */
  private setRefreshTokenCookie(refresh_token: string, response: Response) {
    const options = {
      ...this.getCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    response.cookie('refresh_token', refresh_token, options);
  }

  /**
   * Extracts refresh token from cookies
   *
   * @private
   * @method getRefreshTokenCookie
   * @param {Request} request - Express request object
   * @returns {string|null} Refresh token or null if not exists
   */
  private getRefreshTokenCookie(request: Request): string | null {
    return request.cookies?.['refresh_token'] || null;
  }

  /**
   * Generates JWT token pair (access and refresh)
   *
   * Creates short-lived access token (15 min)
   * and long-lived refresh token (7 days).
   *
   * @async
   * @method generateJWT
   * @param {User} user - User for payload generation
   * @returns {Promise<{access_token: string, refresh_token: string}>} Token pair
   *
   * @example
   * const tokens = await authService.generateJWT(user);
   * // { access_token: 'eyJ...', refresh_token: 'eyJ...' }
   */
  async generateJWT(user: User) {
    const payload: PayloadToken = {
      user: user.id,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: await this.generateRefreshToken(payload),
    };
  }

  /**
   * Generates refresh token with specific secret key
   *
   * @private
   * @async
   * @method generateRefreshToken
   * @param {PayloadToken} payload - Token payload
   * @returns {Promise<string>} Signed refresh token
   * @throws {Error} If secret key not configured
   */
  private async generateRefreshToken(payload: PayloadToken) {
    const secret = this.jwtRefreshTokenSecret;
    if (!secret) {
      throw new Error('JWT refresh token secret is not defined');
    }
    return await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '7d',
    });
  }

  /**
   * Refreshes access token using refresh token
   *
   * Validates refresh token from cookie, verifies user
   * still exists and is active, generates new access token.
   *
   * @async
   * @method refreshToken
   * @param {Request} request - Request with refresh cookie
   * @param {Response} response - Response for new access token
   * @returns {Promise<{statusCode: number, message: string}>}
   * @throws {UnauthorizedException} If no refresh token, invalid, or user inactive
   *
   * @example
   * // Frontend calls automatically before access token expires
   * const result = await authService.refreshToken(req, res);
   */
  async refreshToken(request: Request, response: Response) {
    const refreshToken = this.getRefreshTokenCookie(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    try {
      const secret = this.jwtRefreshTokenSecret;
      if (!secret) {
        throw new Error('JWT refresh token secret is not defined');
      }

      const decoded = await this.jwtService.verifyAsync<PayloadToken>(
        refreshToken,
        { secret },
      );

      const { data } = await this.userService.findOne(decoded.user);
      const user = data as User;

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const payload: PayloadToken = {
        user: user.id,
        role: user.role,
      };

      const newAccessToken = this.jwtService.sign(payload);

      this.setAccessTokenCookie(newAccessToken, response);

      return {
        statusCode: HttpStatus.OK,
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      this.clearCookies(response);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Clears all authentication cookies
   *
   * Removes both access_token and refresh_token cookies.
   * Includes fallback using maxAge: 0 for compatibility.
   *
   * @method clearCookies
   * @param {Response} response - Response to clear cookies
   *
   * @example
   * authService.clearCookies(response);
   */
  clearCookies(response: Response) {
    const options = this.getCookieOptions();

    response.clearCookie('access_token', options);
    response.clearCookie('refresh_token', options);

    // Backup: set expired cookies
    response.cookie('access_token', '', { ...options, maxAge: 0 });
    response.cookie('refresh_token', '', { ...options, maxAge: 0 });
  }

  /**
   * Login - establishes token cookies
   *
   * Generates token pair and sets httpOnly cookies.
   *
   * @async
   * @method login
   * @param {User} user - User logging in
   * @param {Response} response - Response to set cookies
   * @returns {Promise<{statusCode: number, data: User, message: string}>}
   *
   * @example
   * const result = await authService.login(user, response);
   */
  async login(user: User, response: Response) {
    const { access_token, refresh_token } = await this.generateJWT(user);

    this.setAccessTokenCookie(access_token, response);
    this.setRefreshTokenCookie(refresh_token, response);

    return {
      statusCode: HttpStatus.OK,
      data: user,
      message: 'Logged in successfully',
    };
  }

  /**
   * Logout - clears all cookies
   *
   * @method logout
   * @param {Response} response - Response to clear cookies
   * @returns {Object} Success response
   *
   * @example
   * const result = authService.logout(response);
   */
  logout(response: Response) {
    this.clearCookies(response);
    return {
      statusCode: HttpStatus.OK,
      message: 'Logged out successfully',
    };
  }
}
