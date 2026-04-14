/**
 * @fileoverview UserId Decorator
 *
 * Extracts user ID from JWT payload in request.
 * Custom parameter decorator for route handlers.
 *
 * @module user-id.decorator
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PayloadToken } from '@auth/interfaces/token.interface';

/**
 * Custom parameter decorator to extract user ID
 *
 * Extracts user ID from JWT payload in request.
 * Use in controller method parameters.
 *
 * @function UserId
 * @param {unknown} data - Optional data (unused)
 * @param {ExecutionContext} ctx - Execution context
 * @returns {number} User ID from token
 *
 * @example
 * @Get('profile')
 * getProfile(@UserId() userId: number) {
 *   return { userId };
 * }
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const user: PayloadToken = request.user;
    return user.user;
  },
);
