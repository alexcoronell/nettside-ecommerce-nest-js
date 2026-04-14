/**
 * @fileoverview AdminGuard - Admin Authorization Guard
 *
 * Protects routes requiring admin role.
 * Checks JWT payload for ADMIN role.
 *
 * @module admin-auth.guard
 * @version 1.0.0
 * @author Nettside E-commerce Team
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PayloadToken } from '@auth/interfaces/token.interface';
import { UserRoleEnum } from '@commons/enums/user-role.enum';

/**
 * Admin Authorization Guard
 *
 * Protects routes requiring admin role.
 * Throws UnauthorizedException if not admin.
 *
 * @class AdminGuard
 * @implements CanActivate
 *
 * @example
 * @UseGuards(JwtAuthGuard, AdminGuard)
 * @Delete('users/:id')
 * deleteUser() { ... }
 */
@Injectable()
export class AdminGuard implements CanActivate {
  /**
   * CanActivate implementation
   *
   * @method canActivate
   * @param {ExecutionContext} context - Execution context
   * @returns {boolean} True if admin
   * @throws {UnauthorizedException} If not admin
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as PayloadToken;
    if (!user || user.role !== UserRoleEnum.ADMIN) {
      throw new UnauthorizedException('Unauthorized: Admin access required');
    }

    return true;
  }
}
