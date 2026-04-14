/**
 * @fileoverview JwtAuthGuard - JWT Authentication Guard
 *
 * Protects routes requiring valid access token.
 * Uses Passport JWT strategy.
 *
 * @module jwt-auth.guard
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 *
 * Protects endpoints requiring valid access token.
 * Extracts token from httpOnly cookie or Authorization header.
 *
 * @class JwtAuthGuard
 * @extends AuthGuard
 *
 * @example
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile() { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
