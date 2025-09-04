import { Module } from '@nestjs/common';
import { WhoopUserService, WhoopCycleService, WhoopSleepService, WhoopRecoveryService } from './services';
import { WhoopController } from './whoop.controller';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { WhoopOAuthGuard, WhoopCallbackGuard } from './whoop.guard';
import * as Models from './models';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
import { UserModule } from 'src/user/user.module';
const ALL_MODELS = Array.from(new Set([...Object.values(Models)])) as any[];

@Module({
  imports: [SequelizeModule.forFeature(ALL_MODELS), HttpModule, UserModule],
  exports: [SequelizeModule],
  providers: [
    WhoopUserService,
    WhoopCycleService,
    WhoopSleepService,
    WhoopRecoveryService,
    FirebaseAuthGuard,
    WhoopOAuthGuard,
    WhoopCallbackGuard,
  ],
  controllers: [WhoopController],
})
export class WhoopModule {}
