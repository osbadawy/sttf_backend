import { Module } from '@nestjs/common';
import {
  WhoopUserService,
  WhoopCycleService,
  WhoopSleepService,
  WhoopRecoveryService,
  WhoopWorkoutService,
  WhoopWebhookService,
  WhoopAccessService,
} from './services';
import {
  WhoopAuthController,
  WhoopWebhookController,
  WhoopAppController,
  WhoopWorkoutController,
} from './controllers';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import {
  WhoopOAuthGuard,
  WhoopCallbackGuard,
  OAuthStateService,
  WhoopWebhookAccessTokenGuard,
  ExtractFromUrlGuard,
} from './guards';
import * as Models from './models';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
import { UserModule } from 'src/user/user.module';
const ALL_MODELS = Array.from(new Set([...Object.values(Models)])) as any[];
import { CryptoUtil } from 'src/utils';

@Module({
  imports: [SequelizeModule.forFeature(ALL_MODELS), HttpModule, UserModule],
  exports: [SequelizeModule],
  providers: [
    WhoopUserService,
    WhoopCycleService,
    WhoopSleepService,
    WhoopRecoveryService,
    WhoopWorkoutService,
    WhoopWebhookService,
    WhoopAccessService,
    FirebaseAuthGuard,
    WhoopOAuthGuard,
    WhoopCallbackGuard,
    OAuthStateService,
    ExtractFromUrlGuard,
    WhoopWebhookAccessTokenGuard,
    CryptoUtil,
  ],
  controllers: [
    WhoopAuthController,
    WhoopWebhookController,
    WhoopAppController,
    WhoopWorkoutController,
  ],
})
export class WhoopModule {}
