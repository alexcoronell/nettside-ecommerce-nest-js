/**
 * @fileoverview IsNotCustomerGuard - Non-Customer Authorization Guard
 *
 * Blocks customer role from accessing endpoints.
 * Allows ADMIN and other roles.
 *
 * @module is-not-customer.guard
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
 * Non-Customer Authorization Guard
 *
 * Blocks CUSTOMER role from accessing endpoint.
 * Allows ADMIN and other roles.
 *
 * @class IsNotCustomerGuard
 * @implements CanActivate
 *
 * @example
 * @UseGuards(JwtAuthGuard, IsNotCustomerGuard)
 * @Post('products')
 * createProduct() { ... }
 */
@Injectable()
export class IsNotCustomerGuard implements CanActivate {
  /**
   * CanActivate implementation
   *
   * @method canActivate
   * @param {ExecutionContext} context - Execution context
   * @returns {boolean} True if not customer
   * @throws {UnauthorizedException} If customer
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as PayloadToken;
    if (!user || user.role === UserRoleEnum.CUSTOMER) {
      throw new UnauthorizedException('Unauthorized: Customer access denied');
    }

    return true;
  }
}
