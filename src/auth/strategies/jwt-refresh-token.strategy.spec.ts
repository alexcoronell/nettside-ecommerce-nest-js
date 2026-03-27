import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import {
  JwtRefreshTokenStrategy,
  refreshTokenCookieExtractor,
} from './jwt-refresh-token.strategy';

import { PayloadToken } from '@auth/interfaces/token.interface';
import { UserRoleEnum } from '@commons/enums/user-role.enum';
import config from '@config/index';

describe('JwtRefreshTokenStrategy', () => {
  let strategy: JwtRefreshTokenStrategy;

  const mockConfigService = {
    jwtRefreshTokenSecret: 'test-secret',
    jwtRefreshTokenExpirationTime: '1d',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtRefreshTokenStrategy,
        {
          provide: config.KEY,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtRefreshTokenStrategy>(JwtRefreshTokenStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return payload on validate', () => {
    const payload: PayloadToken = { user: 1, role: UserRoleEnum.ADMIN };
    expect(strategy.validate(payload)).toEqual(payload);
  });

  describe('refreshTokenCookieExtractor', () => {
    it('should extract refresh_token from cookies', () => {
      const req = {
        cookies: { refresh_token: 'test-refresh-token' },
      } as Request;
      expect(refreshTokenCookieExtractor(req)).toBe('test-refresh-token');
    });

    it('should return null if no cookies', () => {
      const req = {} as Request;
      expect(refreshTokenCookieExtractor(req)).toBeNull();
    });

    it('should return null if cookies exist but no refresh_token', () => {
      const req = { cookies: { other: 'value' } } as Request;
      expect(refreshTokenCookieExtractor(req)).toBeNull();
    });

    it('should return null if cookies is undefined', () => {
      const req = { cookies: undefined } as Request;
      expect(refreshTokenCookieExtractor(req)).toBeNull();
    });
  });
});
