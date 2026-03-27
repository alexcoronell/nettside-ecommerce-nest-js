/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

import { PayloadToken } from '@auth/interfaces/token.interface';
import config from '@config/index';

/**
 * Custom extractor to get JWT from httpOnly cookie
 * @param req Express Request object
 * @returns JWT token from cookie or null
 */
export const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['access_token'] || null;
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
