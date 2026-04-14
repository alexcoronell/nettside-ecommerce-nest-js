import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { ConfigType } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '@auth/decorators/public.decorator';
import config from '@config/index';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector, // Used to access metadata for routes
    @Inject(config.KEY)
    private readonly configService: ConfigType<typeof config>, // Injects the application's configuration
  ) {}

  canActivate(
    context: ExecutionContext, // Provides access to the current execution context
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check if the route is marked as public
    const isPublic =
      this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler()) || false;
    if (isPublic) {
      // If the route is public, allow access
      return true;
    }

    // Retrieve the HTTP request object
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path;

    // Allow Swagger/OpenAPI endpoints without API key
    const swaggerPaths = [
      '/docs',
      '/docs-json',
      '/swagger',
      '/swagger-ui',
      '/swagger-ui.html',
    ];
    const isSwaggerPath = swaggerPaths.some((p) => path.startsWith(p));
    if (isSwaggerPath) {
      return true;
    }

    const authHeader = request.header('x-api-key'); // Use the standard 'x-api-key' header

    // Validate the API key from the x-api-key header
    if (!authHeader || authHeader !== this.configService.apikey) {
      // If the API key is invalid or missing, throw an UnauthorizedException
      throw new UnauthorizedException('Invalid API key');
    }

    // If the API key is valid, allow access
    return true;
  }
}
