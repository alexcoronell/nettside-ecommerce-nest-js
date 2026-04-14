/**
 * @fileoverview LocalAuthGuard - Local Authentication Guard
 *
 * Protects login route requiring credentials.
 * Uses Passport local strategy.
 *
 * @module local-auth.guard
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Local Authentication Guard
 *
 * Protects endpoints requiring credentials validation.
 * Uses email/password for authentication.
 *
 * @class LocalAuthGuard
 * @extends AuthGuard
 *
 * @example
 * @UseGuards(LocalAuthGuard)
 * @Post('login')
 * login() { ... }
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
