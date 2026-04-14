/**
 * @fileoverview LocalStrategy - Passport Local Authentication Strategy
 *
 * Validates user credentials using email and password.
 * Uses LocalAuthStrategy for authentication (Strategy Pattern - OCP).
 *
 * @module LocalStrategy
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { LocalAuthStrategy } from '@auth/strategies/implementations/local-auth.strategy';
import { CredentialsInput } from '@auth/strategies/contracts/auth-strategy.interface';

/**
 * Passport strategy for local credential authentication
 *
 * Uses LocalAuthStrategy for validation (Strategy Pattern).
 * Delegates credential validation to the strategy implementation.
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
   * @param {LocalAuthStrategy} localAuthStrategy - Local auth strategy implementation
   */
  constructor(private readonly localAuthStrategy: LocalAuthStrategy) {
    super({ usernameField: 'email' });
  }

  /**
   * Validates user credentials
   *
   * Delegates to LocalAuthStrategy.validate() - Strategy Pattern.
   *
   * @async
   * @method validate
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<User>} Validated user or throws
   * @throws {UnauthorizedException} If credentials invalid
   */
  async validate(email: string, password: string) {
    const credentials: CredentialsInput = { email, password };
    const user = await this.localAuthStrategy.validate(credentials);
    if (!user) {
      throw new UnauthorizedException('Not Allow');
    }
    return user;
  }
}
