/**
 * @fileoverview Public Decorator
 *
 * Marks endpoints as public (bypass authentication).
 * Used with JWT AuthGuard to skip token validation.
 *
 * @module public.decorator
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for public endpoint flag
 * @constant {string}
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark endpoint as public
 *
 * Marks endpoint to skip JWT authentication guard.
 * Use with @UseGuards() even for public routes.
 *
 * @function Public
 * @returns {ClassDecorator & MethodDecorator}
 *
 * @example
 * @Public()
 * @Get('health')
 * healthCheck() { return 'OK'; }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
