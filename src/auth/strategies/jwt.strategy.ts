/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

import { PayloadToken } from '@auth/interfaces/token.interface';
import config from '@config/index';

/**
 * Custom extractor to get JWT from httpOnly cookie OR Authorization header
 * @param req Express Request object
 * @returns JWT token from cookie/header or null
 */
export const cookieExtractor = (req: Request): string | null => {
  console.log('REQUEST COOKIES:', req.cookies);
  console.log('REQUEST HEADERS:', req.headers.authorization);

  if (req && req.cookies) {
    const cookies = req.cookies as Record<string, string>;
    const tokenFromCookie = cookies['access_token'] || null;
    if (tokenFromCookie) {
      console.log('TOKEN FROM COOKIE:', tokenFromCookie);
      return tokenFromCookie;
    }
  }

  if (req && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    console.log('AUTH HEADER:', authHeader);
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('TOKEN FROM HEADER:', token);
      return token;
    }
  }

  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(config.KEY) configService: ConfigType<typeof config>) {
    super({
      jwtFromRequest: cookieExtractor, // ✅ Changed from Bearer to Cookie
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
      passReqToCallback: false, // Set to true if you need access to request in validate()
    });
  }

  /**
   * Validates the JWT payload
   * This method is called automatically by Passport after token verification
   * The returned value will be attached to the request object as req.user
   */
  validate(payload: PayloadToken): PayloadToken {
    return payload;
  }
}
