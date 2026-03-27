/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// auth.service.ts - Método refreshToken actualizado
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
import { UserService } from '@user/user.service';
import { User } from '@user/entities/user.entity';
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

  async validateUser(email: string, password: string) {
    const { data } = await this.userService.findAndValidateEmail(email);
    const user = data as User;
    const isMatch = await bcrypt.compare(password, user.password);
    if (user && isMatch) {
      user.password = undefined;
      return user;
    }
    return null;
  }

  private setAccessTokenCookie(access_token: string, response: Response) {
    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      domain: this.cookieDomain,
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
  }

  private setRefreshTokenCookie(refresh_token: string, response: Response) {
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      domain: this.cookieDomain,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private getRefreshTokenCookie(request: Request): string | null {
    return request.cookies?.['refresh_token'] || null;
  }

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

  private async generateRefreshToken(payload: PayloadToken) {
    const secret = this.jwtRefreshTokenSecret;
    if (!secret) {
      throw new Error('JWT refresh token secret is not defined');
    }
    return await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '7d',
    });
  }

  /**
   * Refreshes the access token using the refresh token from cookie
   * ✅ UPDATED METHOD
   */
  async refreshToken(request: Request, response: Response) {
    // Get refresh token from cookie
    const refreshToken = this.getRefreshTokenCookie(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    try {
      // Verify refresh token
      const secret = this.jwtRefreshTokenSecret;
      if (!secret) {
        throw new Error('JWT refresh token secret is not defined');
      }

      const decoded = await this.jwtService.verifyAsync<PayloadToken>(
        refreshToken,
        { secret },
      );

      // Validate user still exists and is active
      const { data } = await this.userService.findOne(decoded.user);
      const user = data as User;

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generate new access token
      const payload: PayloadToken = {
        user: user.id,
        role: user.role,
      };

      const newAccessToken = this.jwtService.sign(payload);

      // Set new access token in cookie
      this.setAccessTokenCookie(newAccessToken, response);

      return {
        statusCode: HttpStatus.OK,
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      // Clear cookies if refresh token is invalid
      this.clearCookies(response);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  clearCookies(response: Response) {
    const cookieOptions = {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? ('none' as const) : ('lax' as const),
      domain: this.cookieDomain,
      path: '/',
    };

    response.clearCookie('access_token', cookieOptions);
    response.clearCookie('refresh_token', cookieOptions);

    // Backup: set expired cookies
    response.cookie('access_token', '', { ...cookieOptions, maxAge: 0 });
    response.cookie('refresh_token', '', { ...cookieOptions, maxAge: 0 });
  }

  async login(user: User, response: Response) {
    const { access_token, refresh_token } = await this.generateJWT(user);

    this.setAccessTokenCookie(access_token, response);
    this.setRefreshTokenCookie(refresh_token, response);

    return {
      statusCode: HttpStatus.OK,
      data: user,
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
