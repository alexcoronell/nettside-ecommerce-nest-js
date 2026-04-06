/**
 * @fileoverview Token Interfaces
 *
 * Defines JWT payload and token-related types.
 *
 * @module token.interface
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { UserRoleEnum } from '@commons/enums/user-role.enum';

/**
 * JWT Token Payload
 *
 * Standard payload for access and refresh tokens.
 * Contains user ID, role, and timestamp info.
 *
 * @interface PayloadToken
 *
 * @example
 * const payload: PayloadToken = {
 *   user: 123,
 *   role: UserRoleEnum.ADMIN,
 *   iat: new Date(),
 *   exp: new Date()
 * };
 */
export interface PayloadToken {
  /** User ID from database */
  user: number;

  /** User role enum */
  role: UserRoleEnum;

  /** Issued at timestamp (optional) */
  iat?: Date;

  /** Expiration timestamp (optional) */
  exp?: Date;
}
