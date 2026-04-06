/**
 * @fileoverview JwtRefreshTokenStrategy - Passport Strategy for Refresh Token
 *
 * Extracts refresh token from httpOnly cookie and validates it.
 * Uses a separate secret from access token.
 *
 * @module JwtRefreshTokenStrategy
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

import { PayloadToken } from '@auth/interfaces/token.interface';
import config from '@config/index';

/**
 * Extracts refresh token from httpOnly cookie
 *
 * @function refreshTokenCookieExtractor
 * @param {Request} req - Express Request object
 * @returns {string | null} Refresh token or null
 *
 * @example
 * const token = extractRefreshToken(req);
 * // null or 'eyJhbGc...'
 */
export const refreshTokenCookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['refresh_token'] || null;
  }
  return null;
};

/**
 * Passport strategy for JWT refresh token validation
 *
 * Uses refreshTokenCookieExtractor to get token from cookie.
 * Validates with jwtRefreshTokenSecret.
 *
 * @class JwtRefreshTokenStrategy
 * @extends PassportStrategy
 *
 * @example
 * // Required config:
 * // jwtRefreshTokenSecret: 'separate-secret-key'
 */
@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  /**
   * Constructor
   *
   * @constructor
   * @param {ConfigType<typeof config>} configService - Injected config
   */
  constructor(@Inject(config.KEY) configService: ConfigType<typeof config>) {
    super({
      jwtFromRequest: refreshTokenCookieExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.jwtRefreshTokenSecret,
      passReqToCallback: false,
    });
  }

  /**
   * Validates refresh token payload
   *
   * Called automatically after token verification.
   * Result attached to req.user.
   *
   * @method validate
   * @param {PayloadToken} payload - Decoded token payload
   * @returns {PayloadToken} User data from token
   */
  validate(payload: PayloadToken): PayloadToken {
    return payload;
  }
}
