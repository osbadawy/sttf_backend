// IMPORTANT: Make sure to import `instrument.ts` at the top of your file.
// If you're using CommonJS (CJS) syntax, use `require("./instrument.ts");`
import 'dotenv/config';
import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import session from 'express-session';
import * as fs from 'fs';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';

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

  // Setup Swagger Documentation TODO: Remove after milestones 2025
  const swaggerPassword = 'cfNovMilestones2025';
  const swaggerUsername = 'CF2025';

  // Middleware for Swagger Basic Auth (only in production)
  const swaggerAuthMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!isProduction || !swaggerPassword) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Swagger API Docs"');
      return res.status(401).send('Authentication required');
    }

    const credentials = Buffer.from(authHeader.substring(6), 'base64').toString(
      'utf-8',
    );
    const [username, password] = credentials.split(':');

    if (username === swaggerUsername && password === swaggerPassword) {
      return next();
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="Swagger API Docs"');
    return res.status(401).send('Invalid credentials');
  };

  const config = new DocumentBuilder()
    .setTitle('STTF Backend API')
    .setDescription('API documentation for STTF Backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter Firebase JWT token',
        in: 'header',
      },
      'firebase-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(httpApp, config);

  // Apply auth middleware only in production with password set
  if (isProduction && swaggerPassword) {
    httpApp.use('/api', swaggerAuthMiddleware);
    httpApp.use('/api-json', swaggerAuthMiddleware);
    httpApp.use('/api-yaml', swaggerAuthMiddleware);
    console.log(
      `Swagger documentation available at http://localhost:${process.env.APP_PORT || 5000}/api (password protected)`,
    );
  } else if (!isProduction) {
    console.log(
      `Swagger documentation available at http://localhost:${process.env.APP_PORT || 5000}/api`,
    );
  } else {
    console.log(
      'Production mode: Swagger documentation is disabled (set SWAGGER_PASSWORD to enable)',
    );
  }

  SwaggerModule.setup('api', httpApp, document);

  // Start HTTP server
  await httpApp.listen(process.env.APP_PORT || 5000, '0.0.0.0');
  console.log(`HTTP Server running on port ${process.env.APP_PORT || 5000}`);

  // Only create HTTPS server in production
  if (isProduction) {
    try {
      // HTTPS options for production
      const httpsOptions = {
        key: fs.readFileSync(
          process.env.SSL_KEY_PATH || '/app/ssl/sttf.api.key',
        ),
        cert: fs.readFileSync(
          process.env.SSL_CERT_PATH || '/app/ssl/sttf.api.crt',
        ),
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

      // Setup Swagger for HTTPS app (same configuration)
      const httpsDocument = SwaggerModule.createDocument(httpsApp, config);
      if (isProduction && swaggerPassword) {
        httpsApp.use('/api', swaggerAuthMiddleware);
        httpsApp.use('/api-json', swaggerAuthMiddleware);
        httpsApp.use('/api-yaml', swaggerAuthMiddleware);
      }
      SwaggerModule.setup('api', httpsApp, httpsDocument);

      // Start HTTPS server on port 443 (standard HTTPS port)
      await httpsApp.listen(443, '0.0.0.0');
      console.log('HTTPS Server running on port 443');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to start HTTPS server:', errorMessage);
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
