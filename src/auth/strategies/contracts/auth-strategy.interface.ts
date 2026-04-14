/**
 * @fileoverview Auth Strategy Interface
 *
 * Defines the contract for authentication strategies following the Strategy Pattern.
 * Enables extensible authentication without modifying existing code (OCP).
 *
 * @module IAuthStrategy
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { User } from '@user/entities/user.entity';
import { Request, Response } from 'express';

/**
 * Input credentials for local authentication (email/password)
 *
 * @interface CredentialsInput
 *
 * @example
 * const creds: CredentialsInput = {
 *   email: 'user@example.com',
 *   password: 'securePassword123'
 * };
 */
export interface CredentialsInput {
  /** User email address */
  email: string;

  /** User password (plain text, to be compared with bcrypt hash) */
  password: string;
}

/**
 * Token pair returned after successful authentication
 *
 * @interface TokenPair
 *
 * @example
 * const tokens: TokenPair = {
 *   access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * };
 */
export interface TokenPair {
  /** Short-lived JWT access token (15 minutes) */
  access_token: string;

  /** Long-lived JWT refresh token (7 days) */
  refresh_token: string;
}

/**
 * Authentication Strategy Contract
 *
 * Defines the interface for all authentication strategies.
 * Implement this to add new auth methods (OAuth, SSO, etc.) without
 * modifying existing code.
 *
 * @interface IAuthStrategy
 *
 * @example
 * // Implementing a new strategy
 * @Injectable()
 * export class OAuthStrategy implements IAuthStrategy {
 *   async validate(credentials: any): Promise<User> {
 *     // OAuth validation logic
 *   }
 *
 *   async generateToken(user: User): Promise<TokenPair> {
 *     // Token generation logic
 *   }
 * }
 */
export interface IAuthStrategy {
  /**
   * Validates user credentials
   *
   * Verifies the provided credentials are valid and returns
   * the authenticated user entity.
   *
   * @async
   * @method validate
   * @param {CredentialsInput} credentials - User credentials to validate
   * @param {Request} [request] - Express request (optional, for context)
   * @returns {Promise<User>} Authenticated user without password
   * @throws {UnauthorizedException} If credentials are invalid
   *
   * @example
   * const user = await strategy.validate({ email: 'user@test.com', password: 'pass' });
   */
  validate(credentials: CredentialsInput, request?: Request): Promise<User>;

  /**
   * Generates JWT token pair for authenticated user
   *
   * Creates access and refresh tokens with appropriate claims.
   *
   * @async
   * @method generateToken
   * @param {User} user - User to generate tokens for
   * @param {Response} [response] - Express response (optional, for cookie setting)
   * @returns {Promise<TokenPair>} Access and refresh token pair
   *
   * @example
   * const tokens = await strategy.generateToken(user, response);
   */
  generateToken(user: User, response?: Response): Promise<TokenPair>;
}

/**
 * Strategy type identifier for DI
 *
 * @enum {string}
 */
export enum AuthStrategyType {
  /** Local email/password authentication */
  LOCAL = 'local',

  /** JWT token authentication */
  JWT = 'jwt',

  /** OAuth/SAML authentication (future) */
  OAUTH = 'oauth',
}

/**
 * Auth Strategy injection token
 *
 * Use this token to inject a specific auth strategy into services.
 *
 * @example
 * // In a module
 * providers: [
 *   { provide: AUTH_STRATEGY_TOKEN, useClass: LocalAuthStrategy }
 * ]
 */
export const AUTH_STRATEGY_TOKEN = 'AUTH_STRATEGY_TOKEN';
