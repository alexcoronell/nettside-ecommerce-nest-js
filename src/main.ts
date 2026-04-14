/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory, Reflector } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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
  app.use(cookieParser());

  // Set global prefix but exclude Swagger
  app.setGlobalPrefix('api/v1', {
    exclude: ['docs', 'docs-json'],
  });

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('Nettside E-commerce API')
    .setDescription('E-commerce API with products, users, sales and more')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new AuditInterceptor(reflector));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
