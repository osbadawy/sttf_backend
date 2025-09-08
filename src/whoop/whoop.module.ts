import { Module } from '@nestjs/common';
import {
  WhoopUserService,
  WhoopCycleService,
  WhoopSleepService,
  WhoopRecoveryService,
  WhoopWorkoutService,
  WhoopWebhookService,
} from './services';
import { WhoopAuthController, WhoopWebhookController } from './controllers';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import {
  WhoopOAuthGuard,
  WhoopCallbackGuard,
  OAuthStateService,
  WhoopWebhookAccessTokenGuard,
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
    FirebaseAuthGuard,
    WhoopOAuthGuard,
    WhoopCallbackGuard,
    OAuthStateService,
    WhoopWebhookAccessTokenGuard,
    CryptoUtil,
  ],
  controllers: [WhoopAuthController, WhoopWebhookController],
})
export class WhoopModule {}
