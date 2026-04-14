/**
 * @fileoverview JwtAuthStrategy - JWT token authentication
 *
 * Implements IAuthStrategy for JWT validation from cookies or Authorization headers.
 * Used by JwtStrategy for protected route authentication.
 *
 * @module JwtAuthStrategy
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

import config from '@config/index';
import { UserService } from '@user/user.service';
import { User } from '@user/entities/user.entity';
import {
  IAuthStrategy,
  CredentialsInput,
  TokenPair,
} from '@auth/strategies/contracts/auth-strategy.interface';
import { PayloadToken } from '@auth/interfaces/token.interface';

/**
 * JWT Authentication Strategy
 *
 * Validates JWT tokens from httpOnly cookies or Authorization headers.
 * Extracts user payload and verifies token signature and expiration.
 *
 * @class JwtAuthStrategy
 * @implements {IAuthStrategy}
 *
 * @example
 * // Used via DI in AuthModule for JWT validation
 * @Injectable()
 * export class JwtAuthStrategy { ... }
 */
@Injectable()
export class JwtAuthStrategy implements IAuthStrategy {
  /**
   * JWT secret for token validation
   * @private
   */
  private readonly jwtSecret: string | null;

  /**
   * Constructor
   *
   * @constructor
   * @param {JwtService} jwtService - JWT service for token verification
   * @param {UserService} userService - User service for user lookup
   * @param {ConfigType<typeof config>} configService - Application config
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @Inject(config.KEY) configService: ConfigType<typeof config>,
  ) {
    this.jwtSecret = configService.jwtSecret ?? null;
  }

  /**
   * Extracts JWT from cookie or Authorization header
   *
   * Prefers access_token cookie, falls back to Bearer token in header.
   *
   * @private
   * @method extractToken
   * @param {Request} request - Express request
   * @returns {string | null} JWT token or null
   */
  private extractToken(request: Request): string | null {
    if (request && request.cookies) {
      const cookies = request.cookies as Record<string, string>;
      const tokenFromCookie = cookies['access_token'] || null;
      if (tokenFromCookie) {
        return tokenFromCookie;
      }
    }

    if (request && request.headers.authorization) {
      const authHeader = request.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
    }

    return null;
  }

  /**
   * Validates JWT token and returns user
   *
   * Extracts token from request, verifies signature and expiration,
   * then looks up the user in the database.
   *
   * @async
   * @method validate
   * @param {CredentialsInput} _credentials - Unused (JWT uses request)
   * @param {Request} request - Express request with token
   * @returns {Promise<User>} Authenticated user
   * @throws {UnauthorizedException} If token invalid or user not found
   *
   * @example
   * // Used by JwtAuthGuard to protect routes
   * const user = await strategy.validate({}, request);
   */
  async validate(
    _credentials: CredentialsInput,
    request: Request,
  ): Promise<User> {
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify token signature and expiration
      if (!this.jwtSecret) {
        throw new Error('JWT secret is not defined');
      }

      const decoded = await this.jwtService.verifyAsync<PayloadToken>(token, {
        secret: this.jwtSecret,
      });

      // Look up user in database
      const { data } = await this.userService.findOne(decoded.user);
      const user = data as User;

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Remove password before returning
      user.password = undefined;

      return user;
    } catch (_error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Generates new token pair for authenticated user
   *
   * This method is less commonly used for JWT strategy since tokens
   * are typically validated, not generated during request validation.
   * For token refresh, use the dedicated refreshToken flow in AuthService.
   *
   * @async
   * @method generateToken
   * @param {User} user - User to generate tokens for
   * @param {Response} [_response] - Unused for JWT strategy
   * @returns {Promise<TokenPair>} Access and refresh token pair
   * @throws {Error} If JWT secret not configured
   *
   * @example
   * // Rarely used - prefer refreshToken flow for token renewal
   * const tokens = await strategy.generateToken(user);
   */
  /* eslint-disable @typescript-eslint/require-await */
  async generateToken(user: User, _response?: Response): Promise<TokenPair> {
    if (!this.jwtSecret) {
      throw new Error('JWT secret is not defined');
    }

    const payload: PayloadToken = {
      user: user.id,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    // Generate refresh token (requires refresh secret which we don't have here)
    // This method exists for interface compatibility but refresh should use AuthService
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.jwtSecret, // Fallback - should use separate refresh secret
      expiresIn: '7d',
    });

    return { access_token, refresh_token };
  }
}
