// IMPORTANT: Make sure to import `instrument.ts` at the top of your file.
// If you're using CommonJS (CJS) syntax, use `require("./instrument.ts");`
import 'dotenv/config';
import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import session from 'express-session';
import * as fs from 'fs';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Create HTTP app (always available)
  const httpApp = await NestFactory.create(AppModule);

  // Configure HTTP app
  httpApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  httpApp.use(
    session({
      secret: process.env.SESSION_SECRET! || 'some-session-secret',
      resave: false,
      saveUninitialized: false,
    }),
  );

  httpApp.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
  });

  // Start HTTP server
  await httpApp.listen(process.env.APP_PORT || 5000, '0.0.0.0');
  console.log(`HTTP Server running on port ${process.env.APP_PORT || 5000}`);

  // Only create HTTPS server in production
  if (isProduction) {
    try {
      // HTTPS options for production
      const httpsOptions = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH || '/app/ssl/sttf.api.key'),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH || '/app/ssl/sttf.api.crt'),
      };

      // Create HTTPS app
      const httpsApp = await NestFactory.create(AppModule, {
        httpsOptions,
      });

      // Configure HTTPS app (same as HTTP)
      httpsApp.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
        }),
      );

      httpsApp.use(
        session({
          secret: process.env.SESSION_SECRET! || 'some-session-secret',
          resave: false,
          saveUninitialized: false,
        }),
      );

      httpsApp.enableCors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'Accept',
          'Origin',
          'X-Requested-With',
        ],
        credentials: true,
      });

      // Start HTTPS server on port 443 (standard HTTPS port)
      await httpsApp.listen(443, '0.0.0.0');
      console.log('HTTPS Server running on port 443');
      
    } catch (error) {
      console.error('Failed to start HTTPS server:', error.message);
      console.log('Continuing with HTTP-only mode');
    }
  } else {
    console.log('Development mode: HTTPS server not started');
  }
}

bootstrap().catch((error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});