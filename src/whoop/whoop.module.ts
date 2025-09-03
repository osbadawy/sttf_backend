import { Module } from '@nestjs/common';
import { WhoopService } from './whoop.service';
import { WhoopController } from './whoop.controller';
import { PassportModule } from '@nestjs/passport';
import { WhoopStrategy } from './whoop.strategy';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { WhoopOAuthGuard, WhoopCallbackGuard } from './whoop.guard';
import * as Models from './models';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
import { UserModule } from '../user/user.module';
const ALL_MODELS = Array.from(new Set([...Object.values(Models)])) as any[];

@Module({
  imports: [
    PassportModule.register({ session: true }),
    SequelizeModule.forFeature(ALL_MODELS),
    HttpModule,
    UserModule,
  ],
  exports: [SequelizeModule],
  providers: [WhoopService, WhoopStrategy, FirebaseAuthGuard, WhoopOAuthGuard, WhoopCallbackGuard],
  controllers: [WhoopController],
})
export class WhoopModule {}
