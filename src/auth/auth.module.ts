/**
 * @fileoverview AuthModule - Authentication Module
 *
 * This module handles user authentication with secure httpOnly cookies.
 * Provides JWT login, token refresh, and logout functionality.
 *
 * @module AuthModule
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';

/* Modules */
import { UserModule } from '@user/user.module';

/* Strategies */
import { LocalStrategy } from '@auth/strategies/local.strategy';
import { JwtStrategy } from '@auth/strategies/jwt.strategy';
import { JwtRefreshTokenStrategy } from '@auth/strategies/jwt-refresh-token.strategy';

/* Service */
import { AuthService } from '@auth/auth.service';

/* Controller */
import { AuthController } from '@auth/auth.controller';

/* Config */
import config from '@config/index';

/**
 * Authentication Module
 *
 * Registers authentication strategies and provides JWT functionality.
 * Uses httpOnly cookies for secure token storage.
 *
 * @class AuthModule
 * @extends Module
 *
 * @example
 * // In AppModule imports:
 * AuthModule,
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [config.KEY],
      useFactory: (configService: ConfigType<typeof config>) => {
        return {
          secret: configService.jwtSecret,
          signOptions: {
            expiresIn: configService.jwtExpirationTime,
          },
        };
      },
    }),
    UserModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshTokenStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
