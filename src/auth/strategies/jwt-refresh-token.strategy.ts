/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
 * Custom extractor to get refresh token from httpOnly cookie
 */
export const refreshTokenCookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['refresh_token'] || null;
  }
  return null;
};

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(@Inject(config.KEY) configService: ConfigType<typeof config>) {
    super({
      jwtFromRequest: refreshTokenCookieExtractor, // ✅ Extract from cookie
      ignoreExpiration: false,
      secretOrKey: configService.jwtRefreshTokenSecret,
      passReqToCallback: false,
    });
  }

  /**
   * Validates the refresh token payload
   */
  validate(payload: PayloadToken): PayloadToken {
    return payload;
  }
}
