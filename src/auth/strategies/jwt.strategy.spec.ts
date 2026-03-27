import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { JwtStrategy, cookieExtractor } from './jwt.strategy';

import { PayloadToken } from '@auth/interfaces/token.interface';
import { UserRoleEnum } from '@commons/enums/user-role.enum';
import config from '@config/index';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    jwtSecret: 'test-secret',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: config.KEY,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return payload on validate', () => {
    const payload: PayloadToken = { user: 1, role: UserRoleEnum.ADMIN };
    expect(strategy.validate(payload)).toEqual(payload);
  });

  describe('cookieExtractor', () => {
    it('should extract access_token from cookies', () => {
      const req = { cookies: { access_token: 'test-token' } } as Request;
      expect(cookieExtractor(req)).toBe('test-token');
    });

    it('should return null if no cookies', () => {
      const req = {} as Request;
      expect(cookieExtractor(req)).toBeNull();
    });

    it('should return null if cookies exist but no access_token', () => {
      const req = { cookies: { other: 'value' } } as Request;
      expect(cookieExtractor(req)).toBeNull();
    });

    it('should return null if cookies is undefined', () => {
      const req = { cookies: undefined } as Request;
      expect(cookieExtractor(req)).toBeNull();
    });
  });
});
