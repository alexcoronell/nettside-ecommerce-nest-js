/**
 * @fileoverview OwnerOrAdminGuard - Owner or Admin Authorization Guard
 *
 * Allows access to resource owner or admin only.
 * Compares user ID from token with route param.
 *
 * @module owner-or-admin-auth.guard
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
 * Owner or Admin Authorization Guard
 *
 * Allows access if user is admin OR owns resource.
 * Resource ID from route params is compared.
 *
 * @class OwnerOrAdminGuard
 * @implements CanActivate
 *
 * @example
 * @UseGuards(JwtAuthGuard, OwnerOrAdminGuard)
 * @Put('users/:id')
 * updateUser() { ... }
 */
@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  /**
   * CanActivate implementation
   *
   * @method canActivate
   * @param {ExecutionContext} context - Execution context
   * @returns {boolean} True if owner or admin
   * @throws {UnauthorizedException} If neither
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as PayloadToken;
    const { id } = request.params;

    if (!user || (user.role !== UserRoleEnum.ADMIN && user.user !== +id)) {
      throw new UnauthorizedException(
        'Unauthorized: Admin or resource owner access required',
      );
    }
    return true;
  }
}
