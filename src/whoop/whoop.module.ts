import { Module } from '@nestjs/common';
import { WhoopService } from './whoop.service';
import { WhoopController } from './whoop.controller';
import { PassportModule } from '@nestjs/passport';
import { WhoopStrategy } from './whoop.strategy';

import * as Models from './models';
import { SequelizeModule } from '@nestjs/sequelize';
const ALL_MODELS = Array.from(new Set([...Object.values(Models)])) as any[];

@Module({
  imports: [PassportModule.register({ session: false }), SequelizeModule.forFeature(ALL_MODELS)],
  exports: [SequelizeModule],
  providers: [WhoopService, WhoopStrategy],
  controllers: [WhoopController],
})
export class WhoopModule {}
