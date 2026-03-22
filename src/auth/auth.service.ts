/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Inject,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { Response, Request } from 'express';
import * as bcrypt from 'bcrypt';

import config from '@config/index';

/* Services */
import { UserService } from '@user/user.service';

/* Entities */
import { User } from '@user/entities/user.entity';

/* Interfaces */
import { PayloadToken } from '@auth/interfaces/token.interface';

@Injectable()
export class AuthService {
  jwtRefreshTokenSecret: string | null = null;
  jwtRefreshTokenExpirationTime: number | null = null;
  isProduction: boolean | undefined = undefined;
  cookieDomain: string | undefined = undefined;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @Inject(config.KEY) configService: ConfigType<typeof config>,
  ) {
    this.jwtRefreshTokenSecret = configService.jwtRefreshTokenSecret ?? null;
    this.jwtRefreshTokenExpirationTime =
      configService.jwtRefreshTokenExpirationTime as unknown as number;
    this.isProduction = configService.isProduction === 'production';
    this.cookieDomain = configService.cookieDomain;
  }

  /**
   * @param email
   * @param password
   * @returns user
   */
  async validateUser(email: string, password: string) {
    const { data } = await this.userService.findAndValidateEmail(email);
    const user = data as User;
    const isMatch = await bcrypt.compare(password, user.password);
    if (user && isMatch) {
      user.password = undefined;
      return user;
    }
  }

  /**
   *
   * @param access_token
   * @param response
   */
  private setAccessTokenCookie(access_token: string, response: Response) {
    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      domain: this.cookieDomain,
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });
  }

  /**
   *
   * @param refresh_token
   * @param response
   */
  private setRefreshTokenCookie(refresh_token: string, response: Response) {
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      domain: this.cookieDomain,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
  }

  private getRefreshTokenCookie(
    cookieName: string,
    request: Request,
  ): string | null {
    return (request.cookies?.[cookieName] as string) || null;
  }

  /**
   * @param user
   * @returns access_token and refresh_token
   */
  async generateJWT(user: User) {
    const payload: PayloadToken = {
      user: user.id,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: await this.generateRefreshToken(payload),
    };
  }

  /**
   * @param payload
   * @returns refreshToken
   */
  private async generateRefreshToken(payload: PayloadToken) {
    const secret = this.jwtRefreshTokenSecret;
    if (!secret) {
      throw new Error('JWT refresh token secret is not defined');
    }
    const refreshToken = this.jwtService.signAsync(payload, {
      secret,
    });
    return await refreshToken;
  }

  /**
   * @param payload
   * @returns refreshToken
   */
  async refreshToken(request: Request, response: Response) {
    const cookie = this.getRefreshTokenCookie('refresh_token', request);
    if (!cookie) {
      throw new UnauthorizedException('Not Allow');
    }
    const userToken = this.jwtService.decode(cookie['refresh_token']);

    const { user } = userToken as PayloadToken;
    const payload: PayloadToken = {
      user,
      role: userToken.role,
    };
    const refreshToken = await this.generateRefreshToken(payload);
    this.setRefreshTokenCookie(refreshToken, response);
  }

  /**
   *
   * @param response
   */
  clearCookies(response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
  }

  /**
   *
   * @param user
   * @param response
   * @returns
   */
  async login(user: User, response: Response) {
    const { access_token, refresh_token } = await this.generateJWT(user);

    this.setAccessTokenCookie(access_token, response);
    this.setRefreshTokenCookie(refresh_token, response);

    return {
      statusCode: HttpStatus.OK,
      message: 'Logged in successfully',
    };
  }

  logout(response: Response) {
    this.clearCookies(response);
    return {
      statusCode: HttpStatus.OK,
      message: 'Logged out successfully',
    };
  }
}
