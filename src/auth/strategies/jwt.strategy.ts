/**
 * @fileoverview JwtStrategy - Passport JWT Strategy
 *
 * Extracts JWT from httpOnly cookie or Authorization header.
 * Uses configured secret to verify signature.
 *
 * @module JwtStrategy
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

import { PayloadToken } from '@auth/interfaces/token.interface';
import config from '@config/index';

/**
 * Extracts JWT from httpOnly cookie or Authorization header
 *
 * Prefers access_token cookie, falls back to Bearer header.
 *
 * @function cookieExtractor
 * @param {Request} req - Express Request object
 * @returns {string | null} JWT token or null
 *
 * @example
 * // From cookie
 * const token = cookieExtractor(req); // 'eyJ...'
 *
 * @example
 * // From header
 * // Authorization: Bearer eyJ...
 * const token = cookieExtractor(req); // 'eyJ...'
 */
export const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    const cookies = req.cookies as Record<string, string>;
    const tokenFromCookie = cookies['access_token'] || null;
    if (tokenFromCookie) {
      return tokenFromCookie;
    }
  }

  if (req && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
  }

  return null;
};

/**
 * Passport JWT validation strategy
 *
 * Uses cookieExtractor to get token from cookie or header.
 * Verifies signature and expiration with configured secret.
 *
 * @class JwtStrategy
 * @extends PassportStrategy
 *
 * @example
 * // Required config:
 * // jwtSecret in config module
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  /**
   * JwtStrategy Constructor
   *
   * @constructor
   * @param {ConfigType<typeof config>} configService - Injected configuration
   */
  constructor(@Inject(config.KEY) configService: ConfigType<typeof config>) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
      passReqToCallback: false,
    });
  }

  /**
   * Validates JWT payload
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
