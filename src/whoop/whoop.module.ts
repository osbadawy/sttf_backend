import { Module } from '@nestjs/common';
import {
  WhoopUserService,
  WhoopCycleService,
  WhoopSleepService,
  WhoopRecoveryService,
  WhoopWorkoutService,
} from './services';
import { WhoopController } from './whoop.controller';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import {
  WhoopOAuthGuard,
  WhoopCallbackGuard,
  OAuthStateService,
  WhoopAccessTokenGuard,
} from './whoop.guard';
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
    FirebaseAuthGuard,
    WhoopOAuthGuard,
    WhoopCallbackGuard,
    OAuthStateService,
    WhoopAccessTokenGuard,
    CryptoUtil,
  ],
  controllers: [WhoopController],
})
export class WhoopModule {}
