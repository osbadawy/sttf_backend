// IMPORTANT: Make sure to import `instrument.ts` at the top of your file.
// If you're using CommonJS (CJS) syntax, use `require("./instrument.ts");`
import 'dotenv/config';
import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have any decorators
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  app.use(
    session({
      secret: process.env.SESSION_SECRET! || 'some-session-secret',
      resave: false,
      saveUninitialized: false,
    }),
  );

  // Enable CORS with permissive settings
  app.enableCors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true, // Allow cookies and authorization headers
  });

  await app.listen(process.env.APP_PORT ?? 5000, '0.0.0.0');
}
bootstrap().catch((error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});
