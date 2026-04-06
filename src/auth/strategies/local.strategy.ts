/**
 * @fileoverview LocalStrategy - Passport Local Authentication Strategy
 *
 * Validates user credentials using email and password.
 * Uses bcrypt for password comparison.
 *
 * @module LocalStrategy
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthService } from '@auth/auth.service';

/**
 * Passport strategy for local credential authentication
 *
 * Validates email/password against database.
 * Uses email as username field.
 *
 * @class LocalStrategy
 * @extends PassportStrategy
 *
 * @example
 * // Used with LocalAuthGuard
 * @UseGuards(LocalAuthGuard)
 * @Post('login')
 * login() { ... }
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  /**
   * Constructor
   *
   * @constructor
   * @param {AuthService} authService - Auth service for validation
   */
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  /**
   * Validates user credentials
   *
   * @async
   * @method validate
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<User|null>} Validated user or throws
   * @throws {UnauthorizedException} If credentials invalid
   */
  async validate(email: string, password: string) {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Not Allow');
    }
    return user;
  }
}
