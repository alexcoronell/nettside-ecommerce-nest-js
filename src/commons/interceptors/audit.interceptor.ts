/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core'; // Importa Reflector
import { NO_AUDIT_KEY } from '@commons/decorators/no-audit.decorator';
import { PayloadToken } from '@auth/interfaces/token.interface';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {} // Inyecta Reflector

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skipAudit = this.reflector.get<boolean>(
      NO_AUDIT_KEY,
      context.getHandler(),
    );

    if (skipAudit) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, body, user } = request;
    const authenticatedUser = user as PayloadToken;

    if (authenticatedUser && authenticatedUser.user && body) {
      if (method === 'POST') {
        body.createdBy = authenticatedUser.user;
        body.updatedBy = authenticatedUser.user;
      } else if (method === 'PATCH' || method === 'PUT') {
        body.updatedBy = authenticatedUser.user;
      }
    }

    return next.handle();
  }
}
