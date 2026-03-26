/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@commons/filters/http-exception-filter';
import { AuditInterceptor } from '@commons/interceptors/audit.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  app.enableCors({
    origin: ['http://localhost:4200'],
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new AuditInterceptor(reflector));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
