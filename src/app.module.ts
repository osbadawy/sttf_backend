import { Module } from '@nestjs/common';
import { SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { WhoopModule } from './whoop/whoop.module';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

// Validate required environment variables
const requiredEnvVars = [
  'POSTGRES_HOST',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

@Module({
  imports: [
    SentryModule.forRoot(),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      autoLoadModels: true,
      synchronize: process.env.NODE_ENV === 'development', // ⚠️ only in dev
    }),
    WhoopModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
