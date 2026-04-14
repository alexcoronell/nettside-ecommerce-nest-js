/**
 * @fileoverview LocalAuthStrategy - Local email/password authentication
 *
 * Implements IAuthStrategy for email/password validation using bcrypt.
 * Used by LocalStrategy for login authentication.
 *
 * @module LocalAuthStrategy
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
import * as bcrypt from 'bcrypt';

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
 * Local Authentication Strategy
 *
 * Validates user credentials (email/password) and generates JWT tokens.
 * Uses bcrypt for secure password comparison.
 *
 * @class LocalAuthStrategy
 * @implements {IAuthStrategy}
 *
 * @example
 * // Used via DI in AuthModule
 * @Injectable()
 * export class AuthModule {
 *   providers: [LocalAuthStrategy, ...]
 * }
 */
@Injectable()
export class LocalAuthStrategy implements IAuthStrategy {
  /**
   * Refresh token secret configuration
   * @private
   */
  private readonly jwtRefreshTokenSecret: string | null;

  /**
   * Refresh token expiration time in seconds
   * @private
   */
  private readonly jwtRefreshTokenExpirationTime: number | null;

  /**
   * Access token expiration time in seconds
   * @private
   */
  private readonly jwtExpirationTime: number | null;

  /**
   * Production environment flag
   * @private
   */
  private readonly isProduction: boolean | undefined;

  /**
   * Cookie domain for subdomains
   * @private
   */
  private readonly cookieDomain: string | undefined;

  /**
   * Constructor
   *
   * @constructor
   * @param {UserService} userService - User service for validation
   * @param {JwtService} jwtService - JWT service for token generation
   * @param {ConfigType<typeof config>} configService - Application config
   */
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(config.KEY) configService: ConfigType<typeof config>,
  ) {
    this.jwtRefreshTokenSecret = configService.jwtRefreshTokenSecret ?? null;
    this.jwtRefreshTokenExpirationTime =
      configService.jwtRefreshTokenExpirationTime as unknown as number;
    this.jwtExpirationTime =
      configService.jwtExpirationTime as unknown as number;
    this.isProduction = configService.isProduction === 'production';
    this.cookieDomain = configService.cookieDomain;
  }

  /**
   * Validates user credentials (email/password)
   *
   * Searches for user by email and compares password with bcrypt hash.
   * Returns user without password if valid.
   *
   * @async
   * @method validate
   * @param {CredentialsInput} credentials - Email and password
   * @param {Request} [_request] - Express request (unused, for interface compatibility)
   * @returns {Promise<User>} Authenticated user without password
   * @throws {UnauthorizedException} If credentials are invalid
   *
   * @example
   * const user = await strategy.validate({ email: 'user@test.com', password: 'pass123' });
   */

  async validate(
    credentials: CredentialsInput,
    _request?: Request,
  ): Promise<User> {
    const { email, password } = credentials;

    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    const { data } = await this.userService.findAndValidateEmail(email);
    const user = data as User;

    /* eslint-disable @typescript-eslint/no-unsafe-call */
    const isMatch = await bcrypt.compare(password, user.password);
    if (user && isMatch) {
      user.password = undefined;
      return user;
    }

    throw new UnauthorizedException('Not Allow');
  }

  /**
   * Generates JWT token pair (access + refresh)
   *
   * Creates short-lived access token (15 min) and long-lived refresh token (7 days).
   * Optionally sets httpOnly cookies if response provided.
   *
   * @async
   * @method generateToken
   * @param {User} user - User to generate tokens for
   * @param {Response} [response] - Express response for cookie setting
   * @returns {Promise<TokenPair>} Access and refresh token pair
   * @throws {Error} If refresh token secret not configured
   *
   * @example
   * const tokens = await strategy.generateToken(user, response);
   */
  async generateToken(user: User, response?: Response): Promise<TokenPair> {
    const payload: PayloadToken = {
      user: user.id,
      role: user.role,
    };

    // Generate access token
    const expirationTime = this.jwtExpirationTime
      ? `${this.jwtExpirationTime}s`
      : '15m';
    const access_token = this.jwtService.sign(payload, {
      expiresIn: expirationTime,
    });

    // Generate refresh token
    const refresh_token = await this.generateRefreshToken(payload);

    // Set cookies if response provided
    if (response) {
      this.setAccessTokenCookie(access_token, response);
      this.setRefreshTokenCookie(refresh_token, response);
    }

    return { access_token, refresh_token };
  }

  /**
   * Generates refresh token with specific secret
   * @private
   * @async
   */
  private async generateRefreshToken(payload: PayloadToken): Promise<string> {
    const secret = this.jwtRefreshTokenSecret;
    if (!secret) {
      throw new Error('JWT refresh token secret is not defined');
    }

    const expirationTime = this.jwtRefreshTokenExpirationTime
      ? `${this.jwtRefreshTokenExpirationTime}s`
      : '7d';

    return await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: expirationTime,
    });
  }

  /**
   * Gets base options for secure cookies
   * @private
   */
  private getCookieOptions() {
    const options: Record<string, any> = {
      httpOnly: true,
      path: '/',
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
    };

    if (this.cookieDomain && this.cookieDomain !== '') {
      options.domain = this.cookieDomain;
    }

    return options;
  }

  /**
   * Sets access token cookie
   * @private
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
   * @private
   */
  private setRefreshTokenCookie(refresh_token: string, response: Response) {
    const options = {
      ...this.getCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    response.cookie('refresh_token', refresh_token, options);
  }
}
