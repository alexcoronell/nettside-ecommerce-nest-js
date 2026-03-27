/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';

/* Services */
import { AuthService } from './auth.service';
import { UserService } from '@user/user.service';

/* Config */
import config from '@config/index';

/* Enums */
import { UserRoleEnum } from '@commons/enums/user-role.enum';

/* Fakers */
import { generateUser } from '@faker/user.faker';
import { PayloadToken } from './interfaces/token.interface';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userService: UserService;

  describe('AuthService', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn().mockReturnValue('mockedJwtToken'),
              signAsync: jest.fn().mockResolvedValue('mockedRefreshToken'),
              verify: jest.fn().mockReturnValue({ userId: 1 }),
              verifyAsync: jest
                .fn()
                .mockResolvedValue({ user: 1, role: UserRoleEnum.ADMIN }),
              decode: jest
                .fn()
                .mockReturnValue({ user: 1, role: UserRoleEnum.ADMIN }),
            },
          },
          {
            provide: UserService,
            useValue: {
              findOneByEmail: jest.fn().mockResolvedValue({
                data: {
                  id: 1,
                  email: 'test@test.com',
                  password: 'hashedPassword',
                },
              }),
              findOne: jest.fn().mockResolvedValue({
                data: {
                  id: 1,
                  email: 'test@test.com',
                  password: 'hashedPassword',
                  isActive: true,
                },
              }),
              findAndValidateEmail: jest.fn().mockResolvedValue({
                data: {
                  id: 1,
                  email: 'test@test.com',
                  password: 'hashedPassword',
                },
              }),
            },
          },
          {
            provide: config.KEY,
            useValue: {
              apikey: undefined,
              jwtSecret: 'testSecret',
              jwtExpirationTime: undefined,
              jwtRefreshTokenSecret: 'testRefreshSecret',
              jwtRefreshTokenExpirationTime: '604800',
            } as unknown as ConfigType<typeof config>,
          },
        ],
      }).compile();

      service = module.get<AuthService>(AuthService);
      jwtService = module.get<JwtService>(JwtService);
      userService = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
      expect(jwtService).toBeDefined();
      expect(userService).toBeDefined();
    });

    describe('validateUser', () => {
      it('should return user data if credentials are valid', async () => {
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        const result = await service.validateUser('test@test.com', 'password');
        expect(result).toEqual({ id: 1, email: 'test@test.com' });
      });

      it('should return null if credentials are invalid', async () => {
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
        const result = await service.validateUser(
          'test@test.com',
          'wrongPassword',
        );
        expect(result).toBeFalsy();
      });
    });

    describe('generateJWT', () => {
      it('should generate access and refresh tokens', async () => {
        const user = generateUser();
        const result = await service.generateJWT(user);
        expect(result).toEqual({
          access_token: 'mockedJwtToken',
          refresh_token: 'mockedRefreshToken',
        });
      });
    });

    describe('refreshToken', () => {
      it('should generate a new access token and set cookie', async () => {
        const mockRequest = {
          cookies: {
            refresh_token: 'someRefreshToken',
          },
        } as unknown as Request;
        const mockResponse = {
          cookie: jest.fn(),
          clearCookie: jest.fn(),
        } as unknown as Response;
        const setAccessTokenCookieSpy = jest.spyOn(
          service as any,
          'setAccessTokenCookie',
        );
        const result = await service.refreshToken(mockRequest, mockResponse);
        expect(setAccessTokenCookieSpy).toHaveBeenCalled();
        expect(result).toEqual({
          statusCode: HttpStatus.OK,
          message: 'Token refreshed successfully',
        });
      });

      it('should throw UnauthorizedException if no refresh token cookie', async () => {
        const mockRequest = {
          cookies: {},
        } as unknown as Request;
        const mockResponse = {
          cookie: jest.fn(),
          clearCookie: jest.fn(),
        } as unknown as Response;
        await expect(
          service.refreshToken(mockRequest, mockResponse),
        ).rejects.toThrow('Refresh token not found');
      });
    });

    describe('generateRefreshToken', () => {
      it('should throw an error if refresh token secret is not defined', async () => {
        service.jwtRefreshTokenSecret = null;
        const payload: PayloadToken = { user: 1, role: UserRoleEnum.ADMIN };
        await expect(service['generateRefreshToken'](payload)).rejects.toThrow(
          'JWT refresh token secret is not defined',
        );
      });

      it('should generate a refresh token', async () => {
        const payload: PayloadToken = { user: 1, role: UserRoleEnum.ADMIN };
        const result = await service['generateRefreshToken'](payload);
        expect(result).toBe('mockedRefreshToken');
      });
    });

    describe('setAccessTokenCookie', () => {
      it('should set access token cookie with correct options', () => {
        const mockResponse = {
          cookie: jest.fn(),
        } as unknown as Response;
        service['setAccessTokenCookie']('testAccessToken', mockResponse);
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'access_token',
          'testAccessToken',
          {
            httpOnly: true,
            secure: service.isProduction,
            sameSite: service.isProduction ? 'none' : 'lax',
            domain: service.cookieDomain,
            path: '/',
            maxAge: 15 * 60 * 1000,
          },
        );
      });
    });

    describe('setRefreshTokenCookie', () => {
      it('should set refresh token cookie with correct options', () => {
        const mockResponse = {
          cookie: jest.fn(),
        } as unknown as Response;
        service['setRefreshTokenCookie']('testRefreshToken', mockResponse);
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'refresh_token',
          'testRefreshToken',
          {
            httpOnly: true,
            secure: service.isProduction,
            sameSite: service.isProduction ? 'none' : 'lax',
            domain: service.cookieDomain,
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
          },
        );
      });
    });

    describe('getRefreshTokenCookie', () => {
      it('should return refresh token cookie value', () => {
        const mockRequest = {
          cookies: {
            refresh_token: 'someToken',
          },
        } as unknown as Request;
        const result = service['getRefreshTokenCookie'](mockRequest);
        expect(result).toBe('someToken');
      });

      it('should return null if cookie does not exist', () => {
        const mockRequest = {
          cookies: {},
        } as unknown as Request;
        const result = service['getRefreshTokenCookie'](mockRequest);
        expect(result).toBeNull();
      });
    });

    describe('clearCookies', () => {
      it('should clear both access_token and refresh_token cookies', () => {
        const mockResponse = {
          clearCookie: jest.fn(),
          cookie: jest.fn(),
        } as unknown as Response;
        service.clearCookies(mockResponse);
        expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      });
    });

    describe('login', () => {
      it('should set tokens and return success response', async () => {
        const user = generateUser();
        const mockResponse = {
          cookie: jest.fn(),
        } as unknown as Response;
        const result = await service.login(user, mockResponse);
        expect(result).toEqual({
          statusCode: 200,
          data: user,
          message: 'Logged in successfully',
        });
        expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      });
    });

    describe('logout', () => {
      it('should clear cookies and return success response', () => {
        const mockResponse = {
          clearCookie: jest.fn(),
          cookie: jest.fn(),
        } as unknown as Response;
        const result = service.logout(mockResponse);
        expect(result).toEqual({
          statusCode: 200,
          message: 'Logged out successfully',
        });
        expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      });
    });
  });
});
