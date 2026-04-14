/**
 * @fileoverview RefreshJwtAuthGuard - Refresh Token Authentication Guard
 *
 * Protects routes requiring valid refresh token.
 * Uses Passport JWT refresh strategy.
 *
 * @module refresh-jwt-auth.guard
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Refresh JWT Authentication Guard
 *
 * Protects endpoints requiring valid refresh token.
 * Extracts from httpOnly cookie.
 *
 * @class RefreshJwtAuthGuard
 * @extends AuthGuard
 *
 * @example
 * @UseGuards(RefreshJwtAuthGuard)
 * @Post('refresh')
 * refresh() { ... }
 */
@Injectable()
export class RefreshJwtAuthGuard extends AuthGuard('jwt-refresh') {}
